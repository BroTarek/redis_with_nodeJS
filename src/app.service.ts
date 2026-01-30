import { Inject, Injectable } from "@nestjs/common";
import { RedisClientType } from "redis";

@Injectable()
export class AppService {
  constructor(
    @Inject("REDIS_CLIENT")
    private readonly redis: RedisClientType,
  ) { }

  async getMyData() {
    // Fetch the keys you set in the CLI
    const name = await this.redis.get("name:1");
    const user = await this.redis.get("User");
    const Student = await this.redis.get("Student");
    const productName = await this.redis.get("ProductName");
    const Range = await this.redis.getRange("MyKey", 0, 3)
    const EndRange = await this.redis.getRange("MyKey", -3, -1)
    const productData = await this.redis.json.set("Product", "$", {
      name: "Product",
      price: 100,
      description: "This is a product"
    });
    const JSONGet = await this.redis.json.get("Product")
    // const listLength = await this.redis.lPush(
    //   "MyList",
    //   ["value1", "value2", "value3"]
    // );
    // const List = await this.redis.lRange("MyList", 0, -4);
    const HashSet=await this.redis.hSet("hash",{
      name:"hash",
      age:25,
      city:"Delhi"
    })
    const hashGetAll=await this.redis.hGetAll("hash")
    return {
      message: "Data fetched from Redis Cloud!",
      data: {
        "name:1": name,
        "User": user,
        "ProductName": productName,
        "Student": Student,
        "Range": Range,
        "EndRange": EndRange,
        "JSONGet": JSONGet,
        // "List": List,
        "hashGetAll":hashGetAll,
        "valueAtIndexZero":await this.redis.LINDEX("MyList",-1)
      }
    };
  }
}
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisSearchService, IndexField } from '../redis-search/redis-search.service';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  brand: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductSearchService implements OnModuleInit {
  private readonly INDEX_NAME = 'products';

  constructor(private readonly redisSearch: RedisSearchService) {}

  async onModuleInit() {
    await this.createProductIndex();
  }

  private async createProductIndex(): Promise<void> {
    const schema: IndexField[] = [
      { name: 'name', type: 'TEXT', sortable: true },
      { name: 'description', type: 'TEXT' },
      { name: 'price', type: 'NUMERIC', sortable: true },
      { name: 'category', type: 'TAG', sortable: true },
      { name: 'tags', type: 'TAG' },
      { name: 'brand', type: 'TAG', sortable: true },
      { name: 'stock', type: 'NUMERIC' },
      { name: 'createdAt', type: 'NUMERIC', sortable: true },
    ];

    await this.redisSearch.createIndex(this.INDEX_NAME, schema, {
      ON: 'HASH',
      PREFIX: `${this.INDEX_NAME}:`,
    });

    // Add suggestions for auto-complete
    await this.addDefaultSuggestions();
  }

  private async addDefaultSuggestions(): Promise<void> {
    const suggestions = [
      'electronics',
      'clothing',
      'books',
      'home',
      'kitchen',
      'sports',
      'beauty',
      'toys',
    ];

    for (const suggestion of suggestions) {
      await this.redisSearch.addSuggestion('product_categories', suggestion, 1);
    }
  }

  async indexProduct(product: Product): Promise<void> {
    const document = {
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      tags: product.tags.join(','),
      brand: product.brand,
      stock: product.stock,
      createdAt: product.createdAt.getTime(),
      updatedAt: product.updatedAt.getTime(),
    };

    await this.redisSearch.addDocument(this.INDEX_NAME, product.id, document);
    
    // Add to suggestions for auto-complete
    await this.redisSearch.addSuggestion('product_names', product.name, 1);
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    const document: any = {};
    
    if (updates.name) document.name = updates.name;
    if (updates.description) document.description = updates.description;
    if (updates.price !== undefined) document.price = updates.price;
    if (updates.category) document.category = updates.category;
    if (updates.tags) document.tags = updates.tags.join(',');
    if (updates.brand) document.brand = updates.brand;
    if (updates.stock !== undefined) document.stock = updates.stock;
    if (updates.updatedAt) document.updatedAt = updates.updatedAt.getTime();

    await this.redisSearch.updateDocument(this.INDEX_NAME, productId, document);
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.redisSearch.deleteDocument(this.INDEX_NAME, productId);
  }

  async searchProducts(
    query: string,
    filters?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      brand?: string;
      inStock?: boolean;
      tags?: string[];
    },
    options?: {
      page?: number;
      limit?: number;
      sortBy?: 'price' | 'createdAt' | 'name';
      sortOrder?: 'ASC' | 'DESC';
    },
  ) {
    let searchQuery = query || '*';
    
    const numericFilters = [];
    const tagFilters = [];

    // Apply filters
    if (filters) {
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        numericFilters.push({
          field: 'price',
          min: filters.minPrice,
          max: filters.maxPrice,
        });
      }

      if (filters.inStock) {
        numericFilters.push({
          field: 'stock',
          min: 1,
        });
      }

      if (filters.category) {
        tagFilters.push({
          field: 'category',
          values: [filters.category],
        });
      }

      if (filters.brand) {
        tagFilters.push({
          field: 'brand',
          values: [filters.brand],
        });
      }

      if (filters.tags && filters.tags.length > 0) {
        tagFilters.push({
          field: 'tags',
          values: filters.tags,
        });
      }
    }

    // Apply pagination and sorting
    const searchOptions = {
      numericFilters,
      tagFilters,
      limit: options?.limit || 10,
      offset: options?.page ? (options.page - 1) * (options.limit || 10) : 0,
      sortBy: options?.sortBy ? {
        field: options.sortBy,
        order: options.sortOrder || 'ASC',
      } : undefined,
    };

    return await this.redisSearch.searchWithFilters(
      this.INDEX_NAME,
      searchQuery,
      searchOptions,
    );
  }

  async autoComplete(query: string): Promise<string[]> {
    return await this.redisSearch.getSuggestions('product_names', query, 10);
  }

  async getCategories(): Promise<string[]> {
    return await this.redisSearch.getSuggestions('product_categories', '', 50);
  }

  async getProductStats() {
    const aggregations = [
      'GROUPBY', '1', '@category',
      'REDUCE', 'COUNT', '0', 'AS', 'count',
      'REDUCE', 'AVG', '1', '@price', 'AS', 'avg_price',
      'REDUCE', 'SUM', '1', '@stock', 'AS', 'total_stock',
      'SORTBY', '2', '@count', 'DESC',
    ];

    return await this.redisSearch.aggregate(this.INDEX_NAME, '*', aggregations);
  }

  async spellCheck(query: string) {
    return await this.redisSearch.spellCheck(this.INDEX_NAME, query);
  }
}
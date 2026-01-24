import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  async getHome() {
    return await this.appService.getMyData();
  }

  @Get("redis-test")
  async testRedis() {
    return await this.appService.getMyData();
  }
}

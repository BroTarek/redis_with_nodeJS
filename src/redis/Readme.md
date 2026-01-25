Redis stream is an append-only data structure 
redis creates a unique id for each stream entry , the id consists of time in meliseconds and sequence number

for example : 0125462425-0
commands:
  XADD
  XDEL
  XLEN

XADD MyStreamKey (NOMKSTREAM) (MAXLEN 10) *(redis to generate the id) name "Ali" age 12

U CAN PERFORM A QUERY ON A STREA AT A PARTICULAR TIME THANKS TO THE ID
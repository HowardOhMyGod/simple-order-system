## How to run the application
Make sure to install docker then run `docker compose up`. The API server and MySQL will be available at port 3000 and 3306 from host.

Steps:
- run `docker compose up`
- connect to MySQL server to create db and tables using query in `data.sql`
- create user and generate pasword (A user can belong to role `customer` or `manager`)
- test the APIs from postman or curl

### Password Generation
You can use this site to generate password: https://www.browserling.com/tools/bcrypt

### MySQL Table Creation
Make sure to create db and tables first using sql query in `data.sql`

### API
You can import `postman_collection.json` to test the API. There are 7 APIs:
- `POST /login` (login to get JWT token)
- `POST /product` (create product)
- `DELETE /product/:id` (soft delete the product)
- `PUT /product/:id` (update product)
- `GET /products?price={}&stock={}` (get product list)
- `GET /orders` (get order list)
- `POST /order` (create order)


## Development Set Up

### Installation
```bash
$ yarn install
```

### Running the app

```bash
$ yarn run start:debug
```


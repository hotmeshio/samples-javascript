# samples-javascript
This repo demonstrates the use of HotMesh/Pluck in a JavaScript environment. Refer to [index.js](./index.js) for how to import, connect, execute and cache.

## Build
The application includes a docker-compose file that spins up one Redis instance and one Node instance. To build the application, run the following command:

```bash
docker-compose up --build -d
```

## Run/Test
Once built, test from any HTTP client (or browser).

```
http://localhost:3000/?first=John
```

>Send different values for `first` to seed entries in the Redis database. Each call will seed a new entry which will disappear after 3 minutes, showing how to use Redis as an operational data cache. The example also demonstrates how to include custom, searchable data, accessible via the FT.SEARCH command.
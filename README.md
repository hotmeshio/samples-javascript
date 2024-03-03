# samples-javascript
This repo demonstrates the use of HotMesh/Pluck in a JavaScript environment. Refer to [test.js](./test.js) for an end-to-end example that connects, caches, executes, indexes, and searches.

## Build
The application includes a docker-compose file that spins up one Redis instance and one Node instance. To build the application, run the following command:

```bash
docker-compose up --build -d
```

## Run/Test
Once built, execute the following command from within the running docker container (pass in any number of names as arguments):

```bash
npm test Jon Jay Joe
```

>A user 'greeting' record will be added to Redis and cached for each name provided. The cache will be used for subsequent requests (for 3 minutes). All data is full-text-searchable via the RediSearch module.
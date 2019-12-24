# Contributing
  
## Project setup

1.  Fork and clone the repo
2.  Run `npm install` to install dependencies and run `npm cover` for running lint and tests with coverage
3.  Create a branch for your PR with `git checkout -b pr/your-branch-name`

## Testing CLI

### Setup 
Bring up local `mongo`, `mongo-express`, `elasticsearch`, `kibana` and `elastichq` instances using docker/docker-compose.yml

### Run
```bash
  $ ./bin/benchmarker -d -n myapp-name -t 1.0.0-beta01 -c ./config/test.json run ./test/fixtures/artillery/test.yml
```

### Accessing elasticsearch
- Access kibana through http://localhost:5601/app/kibana. 
- Add `benchmarks*` as a new index pattern [Management | Index Patterns | Create new pattern]. 
- Check the results under `Discover`.

### Accessing mongo
- Access mongo-express through http://localhost:8081/. 
- Check the results under `benchmarks` database.

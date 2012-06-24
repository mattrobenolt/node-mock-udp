test:
	@NODE_ENV=test \
		./node_modules/.bin/mocha --reporter dot --require should

.PHONY: test
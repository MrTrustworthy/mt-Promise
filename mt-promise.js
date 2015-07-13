var Deferred = function() {
	this.promise = new Promise();
	this.state = Deferred.PENDING;
};

Deferred.FULFILLED = 0;
Deferred.REJECTED = 1;
Deferred.PENDING = 2;

Deferred.debug = false;

/**
 * This is a utility-function that returns a single promise for an array of promises.
 * It updates the promise for every resolved deferred in the same order as the original error.
 * It resolves once all promises have been resolved.
 */
Deferred.when = function() {
	var __deferred = new Deferred();

	// exclude non-promise values and convert arguments to array in one go
	var promises = Array.prototype.filter.call(arguments, function(arg) {
		return (arg instanceof Promise);
	});

	var toGo = promises.length;

	if (toGo < 1) throw RangeError("No Promises have been submitted to Deferred.when, need at least one.");

	// save the solved values for the promises in the same order
	var solveValues = [];
	solveValues.length = toGo;

	promises.forEach(function(promise, index) {

		// after the promise is fulfilled
		promise.then(function(value) {

			solveValues[index] = value;
			__deferred.update(solveValues);

			// decrement counter and resolve if we're done
			if (--toGo === 0) __deferred.resolve(solveValues);
		});
	});

	return __deferred.promise;
};

Deferred.prototype.resolve = function(value, strict) {

	// If the deferred is already closed, we check for the debug-flag and the strict-parameter
	// and give feedback to the caller accordingly
	if(this.state !== Deferred.PENDING){
		Deferred.debug && console.warn("Promise already", this.state, ", can't resolve again");
		if(strict) throw new Error("Promise already", this.state);
		return false;
	}

	// If everything is normal (what is normal anyways?), we mark the deferred and its promise as resolved
	this.state = Deferred.FULFILLED;
	this.promise.state = Deferred.FULFILLED;
	this.promise.endValue = value;

	// last thing to do is execute all cached "then"-calls with the given value
	// NOTE: chaining of promises gets handled by the promises "then" function
	this.promise._resolveFunctions.forEach(function(func) {
		func(value);
	});

	// the reason for returning a boolean depending on whether resolving was successful is
	// that you can strip out the "strict = true" parameter and improve performance
	// for production code by just checking for the return value of "resolve"
	return true;

};

Deferred.prototype.reject = function(errorValue, strict) {

	if(this.state !== Deferred.PENDING){
		Deferred.debug && console.warn("Promise already", this.state, ", can't resolve again");
		if(strict) throw new Error("Promise already", this.state);
		return false;
	}

	this.state = Deferred.REJECTED;
	this.promise.state = Deferred.REJECTED;
	this.promise.endValue = errorValue;
	this.promise._rejectFunctions.forEach(function(func) {
		func(errorValue);
	});

	return true;
};

Deferred.prototype.update = function(value, strict) {

	if(this.state !== Deferred.PENDING){
		Deferred.debug && console.warn("Promise already", this.state, ", can't resolve again");
		if(strict) throw new Error("Promise already", this.state);
		return false;
	}

	this.promise._updateFunctions.forEach(function(func) {
		func(value);
	});
	return true;
};



var Promise = function() {

	this.state = Deferred.PENDING;

	this.endValue = null;

	this._resolveFunctions = [];

	this._rejectFunctions = [];

	this._updateFunctions = [];

};

Promise.prototype.then = function(onResolve, onError, onUpdate) {

	// we need to return a promise at the end of the "then"-call to allow chaining
	var deferred = new Deferred();

	if (onResolve) {
		//if the deferred is already resolved, trigger the function right now
		if (this.state === Deferred.FULFILLED) {
			Deferred.debug && console.info("Promise already resolved, executing \"then\" immediately")
			// execute the function and use its return value as derived value...
			var derivedValue = onResolve(this.endValue);
			// .. for the promise of the current "then"-call to allow promise-chaining
			deferred.resolve(derivedValue);
		} else {
			// if the deferred is still pending, put the resolve function in queue
			// so it can be executed later by the parenting deferred
			this._resolveFunctions.push(function(value) {
				// as above, save the return-value of the function call for the
				// deferred/promise of the current "then"-call
				var derivedValue = onResolve(value);
				deferred.resolve(derivedValue);
			}.bind(this));
		}
	}

	// Same as above for onResolve, so no comments here
	if (onError) {
		if (this.state === Deferred.REJECTED) {
			Deferred.debug && console.info("Promise already rejected, executing \"then\" immediately")
			var derivedErrorValue = onError(this.endValue);
			deferred.reject(derivedErrorValue);
		} else{
			this._rejectFunctions.push(function(errorValue) {
				var derivedErrorValue = onError(errorValue);
				deferred.reject(derivedErrorValue);
			}.bind(this));
		}
	}

	if (onUpdate) {
		// when updating we DON'T pass values to the derived promise because
		// we can't do that in a way that makes sense for the user
		if(this.state !== Deferred.PENDING){
			Deferred.debug && console.warn("Trying to add onUpdate function to already fulfilled promise");
		} else {
			this._updateFunctions.push(function(value) {
				deferred.update(onUpdate(value));
			}.bind(this));
		}
	}

	return deferred.promise;

};

if(typeof exports !== "undefined") exports.Deferred = Deferred;

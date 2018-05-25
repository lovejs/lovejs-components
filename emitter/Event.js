const _ = require("lodash");

class Event {
    constructor(name, data) {
        this.name = name;
        this.data = data;

        this.results = [];
        this.rejects = [];

        this.listeners = [];

        this.stopped = false;
    }

    getName() {
        return this.name;
    }

    getData() {
        return this.data;
    }

    setData(data) {
        this.data = data;
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    getListeners() {
        return this.listeners;
    }

    getLastListener() {
        return _.last(this.listeners);
    }

    getRejects() {
        return this.rejects;
    }

    hasRejects() {
        return this.rejects.length > 0;
    }

    addReject(rejection) {
        this.rejects.push(rejection);
    }

    getLastReject() {
        return _.last(this.rejects);
    }

    getResults() {
        return this.results;
    }

    hasResults() {
        return this.results.length > 0;
    }

    addResult(result) {
        this.results.push(result);
    }

    getLastResult() {
        return _.last(this.results);
    }

    stop() {
        this.stopped = true;
    }

    isStopped() {
        return this.stopped;
    }
}

module.exports = Event;

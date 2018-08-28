import * as _ from "lodash";

export class Tag {
    protected name;
    protected data;

    constructor(name, data?) {
        this.name = name;
        this.data = data;
    }

    getName() {
        return this.name;
    }

    getData(key = null) {
        return key ? _.get(this.data, key) : this.data;
    }

    toString() {
        return `tag-${this.name}`;
    }
}

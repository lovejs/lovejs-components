/**
 * Config tokens are use to store tag data in config tree before tag normalization
 */
export class ConfigToken {
    tag: string;
    data: any;

    constructor(tag: string, data: any = "") {
        this.tag = tag;
        this.data = data;
    }

    /**
     * Get the tag name associated with this config token
     */
    getTag(): string {
        return this.tag;
    }

    /**
     * Return the data associated with this tag data
     */
    getData(): any {
        return this.data;
    }

    /**
     * Set data of the tag data
     * @param data The tag data
     */
    setData(data: any) {
        this.data = data;
    }
}

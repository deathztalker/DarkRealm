/**
 * Object Pool System
 * Reuses objects instead of garbage collecting them for performance.
 */
export class ProjectilePool {
    constructor(createFn, size = 100) {
        this.createFn = createFn;
        this.pool = [];
        for (let i = 0; i < size; i++) {
            const obj = this.createFn();
            obj._inPool = true;
            this.pool.push(obj);
        }
    }

    get(data) {
        let obj = this.pool.find(o => o._inPool);
        if (!obj) {
            obj = this.createFn();
            this.pool.push(obj);
        }
        obj._inPool = false;
        if (obj.init) obj.init(data);
        return obj;
    }

    release(obj) {
        obj._inPool = true;
        if (obj.reset) obj.reset();
    }
}

export class IndexedDBMap {
    private dbName: string;
    private storeName = "store";

    constructor(dbName: string) {
        this.dbName = dbName;
    }

    private async open(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                db.createObjectStore(this.storeName);
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async set<TV>(key: string, value: TV): Promise<void> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, "readwrite");
            const store = tx.objectStore(this.storeName);
            const request = store.put(value, key);
            db.close();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async get<TV>(key: string): Promise<TV | undefined> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, "readonly");
            const store = tx.objectStore(this.storeName);
            const request = store.get(key);
            db.close();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

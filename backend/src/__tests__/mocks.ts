import { vi } from "vitest";

const store = new Map<string, Map<string, any>>();

function getModel(name: string) {
  if (!store.has(name)) store.set(name, new Map());
  return store.get(name)!;
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function mockDoc(name: string, data: any) {
  const id = data._id || makeId();
  const col = getModel(name);
  const merged = { ...data };

  // Apply schema defaults (mimic mongoose defaults)
  if (name === "MagicLink" && merged.used === undefined) merged.used = false;

  const doc: any = { ...merged, _id: id };
  doc.save = vi.fn(async function () {
    col.set(String(doc._id), doc);
    return doc;
  });
  col.set(String(id), doc);
  return doc;
}

function matchDoc(doc: any, query: any): boolean {
  return Object.entries(query).every(([k, v]) => {
    if (v === undefined || v === null) return true;

    // Handle top-level $or operator
    if (k === "$or" && Array.isArray(v)) {
      return v.some((condition: any) => matchDoc(doc, condition));
    }

    if (typeof v === "object" && !Array.isArray(v)) {
      if ("$gte" in v) return new Date(doc[k]).getTime() >= new Date(v.$gte).getTime();
      if ("$lte" in v) return new Date(doc[k]).getTime() <= new Date(v.$lte).getTime();
      if ("$gt" in v) return new Date(doc[k]).getTime() > new Date(v.$gt).getTime();
      if ("$lt" in v) return new Date(doc[k]).getTime() < new Date(v.$lt).getTime();
      if ("$regex" in v) {
        const flags = v.$options || "";
        return new RegExp(v.$regex, flags).test(doc[k] || "");
      }
      if ("$ne" in v) return doc[k] !== v.$ne;
      if ("$in" in v) return v.$in.includes(doc[k]);
      return matchDoc(doc[k] || {}, v);
    }
    return doc[k] === v;
  });
}

function applyUpdate(doc: any, update: any) {
  Object.keys(update).forEach((k) => {
    if (k.startsWith("$")) {
      Object.entries(update[k]).forEach(([uk, uv]) => {
        doc[uk] = uv;
      });
    } else {
      doc[k] = update[k];
    }
  });
}

function makeChainable(arr: any[]) {
  const q: any = [...arr];
  q.sort = function (...args: any[]) {
    const result = [...arr];
    if (args.length > 0 && typeof args[0] === "object") {
      const sortObj = args[0];
      result.sort((a, b) => {
        for (const [key, dir] of Object.entries(sortObj)) {
          const av = a[key], bv = b[key];
          if (av === bv) continue;
          const cmp = av < bv ? -1 : 1;
          return (dir as number) > 0 ? cmp : -cmp;
        }
        return 0;
      });
      return makeChainable(result);
    }
    if (typeof args[0] === "function") {
      result.sort(args[0]);
    }
    return makeChainable(result);
  };
  q.limit = function (n: number) {
    return makeChainable(arr.slice(0, n));
  };
  q.select = function (_fields: any) { return q; };
  q.lean = function () { return q; };
  q.populate = function (_fields: any) { return q; };
  q.then = (resolve: any, reject?: any) => Promise.resolve(arr).then(resolve, reject);
  return q;
}

vi.mock("mongoose", () => {
  const Schema = vi.fn().mockImplementation(function (this: any) {
    this.index = vi.fn().mockReturnThis();
  }) as any;
  Schema.Types = { ObjectId: vi.fn((v: any) => v) };

  function createModel(name: string) {
    const col = () => getModel(name);

    const model: any = vi.fn((data: any) => mockDoc(name, data));

    model.find = vi.fn((query: any = {}) => {
      const results = Array.from(col().values()).filter((doc: any) => matchDoc(doc, query));
      return makeChainable(results);
    });

    model.findOne = vi.fn((query: any = {}) => {
      const results = Array.from(col().values()).filter((doc: any) => matchDoc(doc, query));
      return results.length > 0 ? results[0] : null;
    });

    model.findById = vi.fn((id: any) => {
      const doc = col().get(String(id));
      return doc || null;
    });

    model.findOneAndUpdate = vi.fn((query: any, update: any, opts?: any) => {
      const results = Array.from(col().values()).filter((doc: any) => matchDoc(doc, query));
      if (results.length > 0) {
        applyUpdate(results[0], update);
        col().set(String(results[0]._id), results[0]);
      }
      const doc = opts?.new ? results[0] : (results[0] || null);
      if (doc) {
        doc.select = function () { return doc; };
      }
      return doc;
    });

    model.findByIdAndUpdate = vi.fn((id: any, update: any, opts?: any) => {
      const doc = col().get(String(id));
      if (doc) {
        applyUpdate(doc, update);
        col().set(String(id), doc);
      }
      const result = opts?.new ? doc : (doc || null);
      if (result) {
        result.select = function () { return result; };
      }
      return result;
    });

    model.findOneAndDelete = vi.fn((query: any) => {
      const results = Array.from(col().values()).filter((doc: any) => matchDoc(doc, query));
      if (results.length > 0) {
        col().delete(String(results[0]._id));
      }
      return results.length > 0 ? results[0] : null;
    });

    model.updateMany = vi.fn((query: any, update: any) => {
      col().forEach((doc: any) => {
        if (matchDoc(doc, query)) applyUpdate(doc, update);
      });
      return null;
    });

    model.deleteMany = vi.fn((query: any = {}) => {
      const keys = Object.keys(query);
      if (keys.length === 0 || keys.every((k) => query[k] === undefined)) {
        col().clear();
      } else {
        col().forEach((doc: any, key: string) => {
          if (matchDoc(doc, query)) col().delete(key);
        });
      }
      return null;
    });

    model.create = vi.fn(async (data: any) => {
      return mockDoc(name, data);
    });

    model.insertMany = vi.fn(async (items: any[]) => {
      return items.map((item) => mockDoc(name, item));
    });

    model.countDocuments = vi.fn(() => 0);

    return model;
  }

  return {
    default: {
      connect: vi.fn().mockResolvedValue(true),
      disconnect: vi.fn().mockResolvedValue(true),
      connection: { collections: {} },
      model: createModel,
    },
    Schema,
    model: createModel,
    connect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn().mockResolvedValue(true),
  };
});

vi.mock("connect-mongo", () => ({
  default: { create: vi.fn() },
}));

vi.mock("helmet", () => ({
  default: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock("morgan", () => ({
  default: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock("cors", () => ({
  default: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock("express-rate-limit", () => ({
  default: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock("multer", () => {
  const multerInstance: any = {
    single: vi.fn(() => (req: any, _res: any, next: any) => next()),
  };
  const multerFn = vi.fn(() => multerInstance);
  multerFn.memoryStorage = vi.fn(() => ({}));
  return { default: multerFn };
});

vi.mock("../utils/email", () => ({
  EmailService: {
    sendWelcomeEmail: vi.fn(async () => {}),
    sendVerificationEmail: vi.fn(async () => {}),
    sendPasswordResetEmail: vi.fn(async () => {}),
    sendSubscriptionDetectedEmail: vi.fn(async () => {}),
    sendBillingReminder: vi.fn(async () => {}),
    sendProductUpdate: vi.fn(async () => {}),
  },
}));

vi.mock("../services/exchangeRate.service", () => ({
  getExchangeRate: vi.fn(async () => 1),
  convertAmount: vi.fn((_amount: number, _from: string, _to: string, rate: number) =>
    Math.round(_amount * rate * 100) / 100
  ),
}));

vi.mock("../services/statementProcessor.service", () => ({
  processStatement: vi.fn(async () => ({
    transactionsFound: 3,
    detected: [],
  })),
}));

vi.mock("../services/recurringDetection.service", () => ({
  predictNextDate: vi.fn(() => new Date()),
  detectRecurring: vi.fn(() => []),
}));

vi.mock("../services/merchantNormalization.service", () => ({
  normalizeMerchant: vi.fn((name: string) => name),
  merchantSimilarity: vi.fn(() => 0.5),
}));

// Do NOT mock billingReminder.service here - let individual test files mock it if needed

vi.mock("../config/passport", () => ({}));

vi.mock("../config/database", () => ({
  connectDB: vi.fn(async () => {}),
}));

vi.mock("../config/env", () => ({
  env: {
    MONGODB_URI: "mongodb://localhost:27017/test",
    SESSION_SECRET: "test-secret",
    FRONTEND_URL: "http://localhost:5173",
    PORT: 3001,
    NODE_ENV: "test",
    GEMINI_API_KEY: "",
    GMAIL_EMAIL: "",
    GMAIL_APP_PASSWORD: "",
  },
}));

export {};

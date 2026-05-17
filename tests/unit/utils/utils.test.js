const securityTrack = require('../../../src/utils/securityTrack');
const cache = require('../../../src/utils/cache');
const apiResponse = require('../../../src/utils/apiResponse');

describe("Utility Units", () => {
  
  describe("securityTrack", () => {
    const ip = "1.2.3.4";
    
    beforeEach(() => securityTrack.resetAttempts(ip));

    it("should expire a block", () => {
      const realNow = Date.now;
      try {
        // Record 5 events to block
        for(let i=0; i<5; i++) securityTrack.recordEvent(ip);
        expect(securityTrack.isBlocked(ip)).toBe(true);

        // Mock Date.now to 20 mins in future
        Date.now = () => realNow() + 20 * 60 * 1000;
        expect(securityTrack.isBlocked(ip)).toBe(false);
      } finally {
        Date.now = realNow;
      }
    });
  });

  describe("cache", () => {
    it("should set and get values", () => {
      cache.set("key", { data: 1 });
      expect(cache.get("key")).toEqual({ data: 1 });
    });

    it("should return null on expired key", () => {
        const realNow = Date.now;
        try {
          cache.set("short", "val");
          Date.now = () => realNow() + 120 * 1000; // 2 mins later
          expect(cache.get("short")).toBeNull();
        } finally {
          Date.now = realNow;
        }
    });

    it("should delete by prefix", () => {
        cache.set("user:1:a", 1);
        cache.set("user:1:b", 2);
        cache.set("user:2:a", 3);
        cache.deleteByPrefix("user:1:");
        expect(cache.get("user:1:a")).toBeNull();
        expect(cache.get("user:2:a")).toBeDefined();
    });

    it("should clear cache and get size", () => {
        cache.clear();
        cache.set("a", 1);
        expect(cache.size()).toBe(1);
        cache.clear();
        expect(cache.size()).toBe(0);
    });

    it("should manually delete a key", () => {
        cache.set("a", 1);
        cache.delete("a");
        expect(cache.get("a")).toBeNull();
    });

    it("should cleanup expired keys", () => {
        const realNow = Date.now;
        try {
          cache.set("b", 2, 60);
          cache.set("c", 3, 3600); // long TTL
          Date.now = () => realNow() + 120 * 1000;
          cache.cleanup();
          expect(cache.size()).toBe(1);
          expect(cache.get("c")).toBe(3);
        } finally {
          Date.now = realNow;
        }
    });
  });

  describe("apiResponse", () => {
    it("should send success without data", () => {
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        apiResponse.success(res, "msg");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ status: "success", message: "msg" });
    });

    it("should send error with details", () => {
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        apiResponse.error(res, "err", 400, { field: "required" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ 
            status: "error", 
            message: "err", 
            errors: { field: "required" } 
        });
    });

    it("should send success with data and custom status", () => {
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        apiResponse.success(res, "msg", { user: 1 }, 201);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
             status: "success",
             message: "msg",
             data: { user: 1 }
        });
    });

    it("should send error without details and default status", () => {
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        apiResponse.error(res, "err");
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ status: "error", message: "err" });
    });
  });
});

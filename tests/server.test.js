const mongoose = require("mongoose");
const request = require("supertest");

const app = require("../app");

require("dotenv").config();

/* Connecting to the database before each test. */
beforeEach(async () => {
  await mongoose.connect(
    "mongodb+srv://kpflug:SkTfYjo0cmxh45MD@itcs-5166-project.5rohgme.mongodb.net/?retryWrites=true&w=majority&appName=ITCS-5166-project"
  );
});

/* Closing database connection after each test. */
afterEach(async () => {
  await mongoose.connection.close();
});

describe("GET /api/test/budget", () => {
  it("should return all budget items", async () => {
    const res = await request(app).get("/api/test/budget");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe("User Authentication", () => {
  let user1;

  describe("POST /api/signup", () => {
    it("should add one user", async () => {
      const res = await request(app).post("/api/signup").send({
        name: "Testy McTesterson",
        name: "mrtester",
        password: "123abc",
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body.username).toBe("mrtester");
      user1 = res.body;
    });
  });

  describe("POST /api/login", () => {
    it("should login", async () => {
      const res = await request(app).post("/api/login").send({
        username: "jdoe",
        password: "mypassword",
      });
      expect(res.statusCode).toBe(200);
    });

    it("should not login", async () => {
      const res = await request(app).post("/api/login").send({
        username: "user1@example.com",
        password: "1234",
      });
      expect(res.statusCode).toBe(401);
    });
  });
});

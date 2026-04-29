import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("taxi.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    role TEXT,
    car_model TEXT,
    car_number TEXT
  );

  CREATE TABLE IF NOT EXISTS rides (
    id TEXT PRIMARY KEY,
    driver_id TEXT,
    from_loc TEXT,
    to_loc TEXT,
    price INTEGER,
    seats INTEGER,
    departure_time TEXT,
    departure_date TEXT DEFAULT 'today',
    has_delivery INTEGER DEFAULT 0,
    note TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(driver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    passenger_id TEXT,
    from_loc TEXT,
    to_loc TEXT,
    seats INTEGER,
    departure_time TEXT,
    departure_date TEXT DEFAULT 'today',
    has_delivery INTEGER DEFAULT 0,
    note TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(passenger_id) REFERENCES users(id)
  );

  -- Clear existing mock data for a fresh start
  DELETE FROM rides;
  DELETE FROM requests;
`);

try {
  db.prepare("ALTER TABLE rides ADD COLUMN departure_date TEXT DEFAULT 'today'").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE requests ADD COLUMN departure_date TEXT DEFAULT 'today'").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE requests ADD COLUMN departure_time TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE rides ADD COLUMN has_delivery INTEGER DEFAULT 0").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE requests ADD COLUMN has_delivery INTEGER DEFAULT 0").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE rides ADD COLUMN note TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE requests ADD COLUMN note TEXT").run();
} catch (e) {}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  app.use(express.json());

  // API Routes
  app.post("/api/users", (req, res) => {
    const { id, name, phone, role, car_model, car_number } = req.body;
    const stmt = db.prepare("INSERT OR REPLACE INTO users (id, name, phone, role, car_model, car_number) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(id, name, phone, role, car_model || null, car_number || null);
    res.json({ success: true });
  });

  app.get("/api/rides", (req, res) => {
    const rides = db.prepare(`
      SELECT r.*, u.name as driver_name, u.phone as driver_phone, u.car_model, u.car_number 
      FROM rides r 
      JOIN users u ON r.driver_id = u.id 
      WHERE r.status = 'active'
      ORDER BY r.departure_date ASC, r.created_at DESC
    `).all();
    res.json(rides);
  });

  app.get("/api/requests", (req, res) => {
    const requests = db.prepare(`
      SELECT r.*, u.name as passenger_name, u.phone as passenger_phone 
      FROM requests r 
      JOIN users u ON r.passenger_id = u.id 
      WHERE r.status = 'active'
      ORDER BY r.departure_date ASC, r.created_at DESC
    `).all();
    res.json(requests);
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("post_ride", (ride) => {
      const stmt = db.prepare("INSERT INTO rides (id, driver_id, from_loc, to_loc, price, seats, departure_time, departure_date, has_delivery, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      stmt.run(ride.id, ride.driver_id, ride.from_loc, ride.to_loc, ride.price, ride.seats, ride.departure_time, ride.departure_date || 'today', ride.has_delivery ? 1 : 0, ride.note || null);
      
      const fullRide = db.prepare(`
        SELECT r.*, u.name as driver_name, u.phone as driver_phone, u.car_model, u.car_number 
        FROM rides r 
        JOIN users u ON r.driver_id = u.id 
        WHERE r.id = ?
      `).get(ride.id);
      
      io.emit("new_ride", fullRide);
    });

    socket.on("post_request", (request) => {
      const stmt = db.prepare("INSERT INTO requests (id, passenger_id, from_loc, to_loc, seats, departure_time, departure_date, has_delivery, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
      stmt.run(request.id, request.passenger_id, request.from_loc, request.to_loc, request.seats, request.departure_time, request.departure_date || 'today', request.has_delivery ? 1 : 0, request.note || null);
      
      const fullRequest = db.prepare(`
        SELECT r.*, u.name as passenger_name, u.phone as passenger_phone 
        FROM requests r 
        JOIN users u ON r.passenger_id = u.id 
        WHERE r.id = ?
      `).get(request.id);
      
      io.emit("new_request", fullRequest);
    });

    socket.on("update_ride", (ride) => {
      const stmt = db.prepare("UPDATE rides SET seats = ?, departure_time = ? WHERE id = ?");
      stmt.run(ride.seats, ride.departure_time, ride.id);
      
      const updatedRide = db.prepare(`
        SELECT r.*, u.name as driver_name, u.phone as driver_phone, u.car_model, u.car_number 
        FROM rides r 
        JOIN users u ON r.driver_id = u.id 
        WHERE r.id = ?
      `).get(ride.id);
      
      io.emit("ride_updated", updatedRide);
    });

    socket.on("delete_ride", (rideId) => {
      db.prepare("UPDATE rides SET status = 'deleted' WHERE id = ?").run(rideId);
      
      const updatedRide = db.prepare(`
        SELECT r.*, u.name as driver_name, u.phone as driver_phone, u.car_model, u.car_number 
        FROM rides r 
        JOIN users u ON r.driver_id = u.id 
        WHERE r.id = ?
      `).get(rideId);
      
      io.emit("ride_updated", updatedRide);
    });

    socket.on("permanent_delete_ride", (rideId) => {
      db.prepare("DELETE FROM rides WHERE id = ?").run(rideId);
      io.emit("ride_permanently_deleted", rideId);
    });

    socket.on("delete_request", (requestId) => {
      db.prepare("UPDATE requests SET status = 'deleted' WHERE id = ?").run(requestId);
      
      const updatedRequest = db.prepare(`
        SELECT r.*, u.name as passenger_name, u.phone as passenger_phone 
        FROM requests r 
        JOIN users u ON r.passenger_id = u.id 
        WHERE r.id = ?
      `).get(requestId);
      
      io.emit("request_updated", updatedRequest);
    });

    socket.on("permanent_delete_request", (requestId) => {
      db.prepare("DELETE FROM requests WHERE id = ?").run(requestId);
      io.emit("request_permanently_deleted", requestId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

# Specialty Showcase: Airspace Simulation

## A Distributed Real-Time Simulation Built From Scratch in C++20

This project is the ultimate proof that Michael Nusair isn't just a web developer who deploys to Vercel. He's a systems engineer who builds distributed, real-time simulation platforms from the ground up — in C++.

---

## What It Is

**Airspace Sim** is a distributed, real-time airspace monitoring and intercept-modeling simulation platform. It ingests synthetic radar data, fuses it into aircraft tracks using Kalman filtering, computes intercept predictions, and visualizes everything on an interactive 3D map.

This is the kind of system built by defense contractors with teams of dozens. Michael built it alone.

---

## Architecture

7 microservices communicating over Eclipse CycloneDDS (Data Distribution Service):

```
[Sensor Simulator 1]  [Sensor Simulator 2]  [Sensor Simulator N]
         |                     |                      |
         +--------- DDS Topic: RadarDetection ---------+
                               |
                    [Track Fusion Service]
                     (Kalman Filter — C++20)
                               |
                    DDS Topic: AircraftTrack
                               |
                    [Intercept Solver]
                     (Geometry Engine — C++20)
                               |
                    DDS Topic: InterceptPrediction
                               |
                    [Simulation Controller]
                               |
                    DDS Topic: SimulationEvent
                               |
                    [WebSocket Bridge — Node.js/TypeScript]
                               |
                    [React Frontend — deck.gl + MapLibre GL]
                     (3D Interactive Map)
```

---

## Tech Stack

| Component | Technology |
|---|---|
| **Core Services** | C++20 (GCC 13 / Clang 17) |
| **Build System** | CMake |
| **Middleware** | Eclipse CycloneDDS (Data Distribution Service) |
| **Logging** | spdlog |
| **JSON** | nlohmann/json |
| **WebSocket** | websocketpp |
| **Bridge** | Node.js, TypeScript, Express, ws |
| **Frontend** | React 18, deck.gl 9, MapLibre GL JS, Vite 6 |
| **Python Tools** | watchdog, httpx, websocket-client |
| **Infrastructure** | Docker Compose (11 Dockerfiles), AWS CloudFormation |
| **Deployment** | EC2 + VPC + Elastic IP, nginx |

---

## Technical Deep Dive

### DDS (Data Distribution Service)
DDS is the middleware standard used in military and aerospace systems for real-time data distribution. It's what you use when MQTT, Kafka, or Redis Pub/Sub aren't fast or reliable enough.

Michael chose Eclipse CycloneDDS and implemented:
- **IDL-defined interfaces** with auto-generated C++ bindings
- **Four DDS topics:** `RadarDetection`, `AircraftTrack`, `InterceptPrediction`, `SimulationEvent`
- **Quality of Service (QoS) policies** for reliability and latency tuning
- **Discovery and participant management** across multiple services

### Kalman Filter Track Fusion
The track fusion service implements **Kalman filtering** — a mathematical algorithm that combines noisy sensor readings from multiple radars into a single, accurate aircraft track.

This requires:
- State estimation and prediction
- Measurement update with sensor noise modeling
- Multi-sensor correlation (associating detections from different radars with the same aircraft)
- Track lifecycle management (creation, maintenance, deletion)

### Intercept Geometry Solver
The intercept solver computes:
- Optimal intercept trajectories given aircraft positions and velocities
- Time-to-intercept calculations
- Probability assessments based on track uncertainty
- Real-time updates as tracks evolve

### Sensor Simulation
The sensor simulators generate realistic radar data, including:
- Radar physics modeling (detection probability, range, bearing)
- Terrain effects on radar coverage
- Sector-based partitioning for horizontal scaling
- Configurable scenario generation

### WebSocket Bridge
A Node.js/TypeScript bridge translates DDS topics into WebSocket messages for the browser-based frontend. This bridge:
- Subscribes to DDS topics via a native bridge
- Transforms C++ data structures into JSON
- Manages WebSocket connections with reconnection logic
- Handles backpressure from slow clients

### 3D Visualization
The React frontend renders everything on an interactive 3D map using:
- **deck.gl 9** — GPU-accelerated geospatial layers
- **MapLibre GL JS** — Open-source map rendering
- Real-time updates as tracks and intercepts evolve
- Interactive controls for scenario management

---

## Infrastructure

### 11 Dockerfiles
Every service has its own container:
- Multi-stage builds for optimized C++ images
- Shared base images for DDS dependencies
- Docker Compose orchestration for local development
- Health checks and dependency management

### AWS Deployment
- **CloudFormation** template for one-command deploy
- EC2 instance with VPC and Elastic IP
- nginx reverse proxy for the web frontend
- Deploy and teardown scripts for rapid environment management

---

## Why This Project Matters

### It Proves Language Breadth
Most "full-stack" engineers work in JavaScript/TypeScript. Michael works in C++20 — with CMake, templates, smart pointers, and systems-level memory management. This isn't a "Hello World in C++" — it's a multi-service simulation with complex algorithms.

### It Proves Architectural Depth
DDS middleware, Kalman filtering, intercept geometry — these are patterns from aerospace and defense engineering, not web tutorials. Michael understands distributed systems at the protocol level, not just the framework level.

### It Proves Integration Skill
Connecting C++ DDS services to a Node.js WebSocket bridge to a React deck.gl frontend requires thinking across language boundaries, data formats, and real-time constraints. This is full-stack in the truest sense.

### It Proves Independent Capability
This system would typically be built by a team of 5-10 engineers across radar, simulation, backend, and frontend specialties. Michael designed and built the entire thing.

---

## What a Potential Client Should Think

> "If this person can build a distributed real-time simulation with C++ microservices, DDS middleware, Kalman filtering, and 3D geospatial visualization — they can definitely handle my SaaS application, cloud migration, or AI integration."

That's the point. Airspace Sim is the ceiling. It shows what Michael is capable of at his most technically ambitious. Every other project is well within that range.

---

## Links

- Local project: `~/Documents/code/airspace-sim`
- Infrastructure: AWS CloudFormation + Docker Compose
- Frontend: `localhost` with deck.gl 3D map

---

## Key Takeaway

> Airspace Sim is Michael's technical tour de force. It combines C++20, DDS middleware, Kalman filtering, intercept geometry, Docker orchestration, AWS deployment, and 3D browser visualization into a single distributed system — built by one person. If you need an engineer who can operate at any level of the stack, this is your proof.

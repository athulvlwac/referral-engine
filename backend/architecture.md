# Obsidian Pulse Referral Engine Architecture

This document provides a high-level overview of the architectural decisions and system design for the DAG-enforced cycle-safe Referral Engine.

## 1. Data Model (SQLAlchemy/SQLite)
The application utilizes a relational database mapped through asynchronous SQLAlchemy to model the Directed Acyclic Graph (DAG).

- **`User` (Nodes)**: Represents a single entity in the network. Contains auth credentials (`password_hash`, `role`), a unique `referral_code`, `reward_balance`, and `status`.
- **`Referral` (Edges)**: Represents a directed edge (`child_id` -> `parent_id`). A constraint exists requiring each `child_id` to be completely unique, ensuring no user can have more than one parent.
- **`FraudLog`**: An audit trail table. It holds details of any suspicious blocked requests (e.g., cycle attempts, velocity spikes).
- **`SystemMetrics`**: A singleton table dedicated to aggregating O(1) performance counters for dashboard widgets to prevent expensive table-scans (Count queries) on millions of rows.

## 2. Core Logic: DAG Cycle Detection
To absolutely guarantee the absence of cyclical referrals (e.g., A -> B -> C -> A), the engine performs a pre-flight Breadth-First-Search (BFS) traversal of the graph **before** committing any new referral edge.

When a referral claim is triggered (`Attempt: Child(A) -> Parent(C)`):
1. The engine fetches `Parent(C)`.
2. It walks upward through the `parent_id` foreign keys (visiting C's parent, then that parent's parent, etc).
3. If the traversal ever encounters `Child(A)` as an ancestor, a cycle is detected. The transaction is instantly rolled back, an `HTTP 400` is returned, and a `FraudLog` entry (`reason='cycle'`) is recorded.
4. Because this tree traversal runs against indexed Foreign Keys, the query typically resolves in `<15ms`, thoroughly satisfying the `<100ms` strict performance constraint.

## 3. Rewards Engine
Reward processing (`app/services/rewards.py`) operates strictly upward. Since the graph is guaranteed cycle-free by the step before, iterating upward is inherently safe.
- **Logic**: Base reward * % factor based on depth difference. 
- The system recursively loops through ancestors exactly 3 levels deep from the child. Incremental balances are transacted directly onto the varying profiles (`user.reward_balance += amount`).

## 4. Role-Based Security (JWT JWT-Auth)
To ensure system safety, the API operates in a two-tier configuration enabled by FastAPI Dependency Injection and `bcrypt` tokenization.

- **Admin Layer**: Strict `Depends(require_admin)` locks over all endpoints that return global network scopes (e.g., `/dashboard/metrics`, `/fraud/flags`, `/referrals`, `/users`).
- **User Layer (Panel)**: Regular users get isolated `sub` tokens mapping their identities to `/user/me` routes. The `GET /user/me/graph` endpoint reuses the same traversal algorithms as the core system but forcefully limits the root graph traversal node to their authenticated JWT identity, preventing cross-tree eavesdropping.

## 5. Temporal Protections & Fraud Constraints
- **Temporal**: Registrations/Referral claims made more than 24 hours after a child's creation are rejected directly via `datetime` differential checks.
- **Velocity**: Rate limiting tracks sliding timestamps per IP/User to restrict brute-force spam.

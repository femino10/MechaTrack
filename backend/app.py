from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# ---------------- CONFIG ----------------
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////home/felix/InventoryTracker/inventory.db'
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['JWT_SECRET_KEY'] = 'mechatrack-secret-key-2025'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

db = SQLAlchemy(app)
jwt = JWTManager(app)

print("Using database:", app.config['SQLALCHEMY_DATABASE_URI'])

# ---------------- MODELS ----------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "email": self.email, "name": self.name}


class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        offset = timedelta(hours=3)
        created_local = self.created_at + offset
        updated_local = self.updated_at + offset
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category or "Uncategorized",
            "quantity": self.quantity,
            "price": self.price,
            "created_at": created_local.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": updated_local.strftime("%Y-%m-%d %H:%M:%S"),
        }


class Tool(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default="Available")
    borrower = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        offset = timedelta(hours=3)
        created_local = self.created_at + offset
        updated_local = self.updated_at + offset
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category or "Uncategorized",
            "status": self.status,
            "borrower": self.borrower,
            "created_at": created_local.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": updated_local.strftime("%Y-%m-%d %H:%M:%S"),
        }


class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    vehicle_reg = db.Column(db.String(20), nullable=False)
    service = db.Column(db.String(200), nullable=False)
    cost = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="Pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        offset = timedelta(hours=3)
        created_local = self.created_at + offset
        updated_local = self.updated_at + offset
        return {
            "id": self.id,
            "customer_name": self.customer_name,
            "vehicle_reg": self.vehicle_reg,
            "service": self.service,
            "cost": self.cost,
            "status": self.status,
            "created_at": created_local.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": updated_local.strftime("%Y-%m-%d %H:%M:%S"),
        }


# ---------------- INITIALIZE DB ----------------
with app.app_context():
    db.create_all()
    print("Database tables created.")


# ---------------- SEED DATA (Run ONCE) ----------------
def seed_data():
    common_parts = [
        {"name": "Engine Block", "category": "Engine and Powertrain", "quantity": 2, "price": 45000.0},
        {"name": "Piston Set", "category": "Engine and Powertrain", "quantity": 8, "price": 12000.0},
        {"name": "Brake Pads (Front)", "category": "Brakes", "quantity": 15, "price": 2500.0},
        {"name": "Brake Disc", "category": "Brakes", "quantity": 10, "price": 6000.0},
        {"name": "Oil Filter", "category": "Maintenance", "quantity": 30, "price": 800.0},
        {"name": "Air Filter", "category": "Maintenance", "quantity": 25, "price": 1200.0},
    ]
    for part in common_parts:
        if not Item.query.filter_by(name=part["name"]).first():
            new_item = Item(**part)
            db.session.add(new_item)
    db.session.commit()
    print("Seeded common parts!")


# Uncomment ONCE to seed, then comment back
# with app.app_context():
#     seed_data()


# ---------------- AUTH ROUTES ----------------
@app.route("/api/auth/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        name = data.get("name")

        if not all([email, password, name]):
            return jsonify({"error": "All fields required"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400

        user = User(email=email, name=name)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User created"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# FIXED: identity=str(user.id), returns "token" not "access_token"
@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({"error": "Invalid email or password"}), 401

        token = create_access_token(identity=str(user.id), fresh=True)  # ← STRING ID
        return jsonify({"token": token, "user": user.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- ITEM ROUTES ----------------
@app.route("/items", methods=["GET"])
@jwt_required()
def get_items():
    items = Item.query.order_by(Item.id.asc()).all()
    return jsonify([item.to_dict() for item in items])


@app.route("/items", methods=["POST"])
@jwt_required()
def add_item():
    data = request.get_json()
    name = data.get("name")
    category = data.get("category")
    quantity = data.get("quantity")
    price = data.get("price")

    if not name or quantity is None:
        return jsonify({"error": "Name and quantity required"}), 400

    try:
        new_item = Item(name=name, category=category, quantity=quantity, price=price)
        db.session.add(new_item)
        db.session.commit()
        return jsonify(new_item.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/items/<int:item_id>", methods=["DELETE"])
@jwt_required()
def delete_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item deleted"})


@app.route("/items/<int:item_id>", methods=["PUT"])
@jwt_required()
def update_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404

    data = request.get_json()
    item.name = data.get("name", item.name)
    item.category = data.get("category", item.category)
    item.quantity = data.get("quantity", item.quantity)
    item.price = data.get("price", item.price)

    db.session.commit()
    return jsonify(item.to_dict())


# ---------------- TOOL ROUTES ----------------
@app.route("/tools", methods=["GET"])
@jwt_required()
def get_tools():
    tools = Tool.query.order_by(Tool.id.asc()).all()
    return jsonify([tool.to_dict() for tool in tools])


@app.route("/tools", methods=["POST"])
@jwt_required()
def add_tool():
    data = request.get_json()
    name = data.get("name")
    category = data.get("category")
    status = data.get("status", "Available")
    borrower = data.get("borrower")

    if not name:
        return jsonify({"error": "Name required"}), 400

    new_tool = Tool(name=name, category=category, status=status, borrower=borrower)
    db.session.add(new_tool)
    db.session.commit()
    return jsonify(new_tool.to_dict()), 201


@app.route("/tools/<int:tool_id>", methods=["DELETE"])
@jwt_required()
def delete_tool(tool_id):
    tool = Tool.query.get(tool_id)
    if not tool:
        return jsonify({"error": "Tool not found"}), 404
    db.session.delete(tool)
    db.session.commit()
    return jsonify({"message": "Tool deleted"})


@app.route("/tools/<int:tool_id>", methods=["PUT"])
@jwt_required()
def update_tool(tool_id):
    tool = Tool.query.get(tool_id)
    if not tool:
        return jsonify({"error": "Tool not found"}), 404

    data = request.get_json()
    tool.name = data.get("name", tool.name)
    tool.category = data.get("category", tool.category)
    tool.status = data.get("status", tool.status)
    tool.borrower = data.get("borrower", tool.borrower)

    db.session.commit()
    return jsonify(tool.to_dict())


# ---------------- JOB ROUTES ----------------
@app.route("/jobs", methods=["GET"])
@jwt_required()
def get_jobs():
    jobs = Job.query.order_by(Job.id.asc()).all()
    return jsonify([job.to_dict() for job in jobs])


@app.route("/jobs", methods=["POST"])
@jwt_required()
def add_job():
    data = request.get_json()

    required = ["customer_name", "vehicle_reg", "service", "cost"]
    for field in required:
        if field not in data or not data[field]:
            return jsonify({"error": f"{field} is required"}), 400

    try:
        cost = float(data["cost"])
        if cost <= 0:
            return jsonify({"error": "Cost must be positive"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Cost must be a valid number"}), 400

    new_job = Job(
        customer_name=data["customer_name"].strip(),
        vehicle_reg=data["vehicle_reg"].strip(),
        service=data["service"].strip(),
        cost=cost,
        status=data.get("status", "Pending")
    )
    db.session.add(new_job)
    db.session.commit()
    return jsonify(new_job.to_dict()), 201

@app.route("/jobs/<int:job_id>", methods=["DELETE"])
@jwt_required()
def delete_job(job_id):
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    db.session.delete(job)
    db.session.commit()
    return jsonify({"message": "Job deleted"})


@app.route("/jobs/<int:job_id>", methods=["PUT"])
@jwt_required()
def update_job(job_id):
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data = request.get_json()
    job.customer_name = data.get("customer_name", job.customer_name)
    job.vehicle_reg = data.get("vehicle_reg", job.vehicle_reg)
    job.service = data.get("service", job.service)
    job.cost = float(data.get("cost", job.cost))
    job.status = data.get("status", job.status)

    db.session.commit()
    return jsonify(job.to_dict())

@app.route("/reports")
@jwt_required()
def get_reports():
    jobs = Job.query.all()
    total_revenue = sum(job.cost for job in jobs)
    pending = len([j for j in jobs if j.status == "Pending"])
    in_progress = len([j for j in jobs if j.status == "In Progress"])
    completed = len([j for j in jobs if j.status == "Completed"])

    return jsonify({
        "totalJobs": len(jobs),
        "totalRevenue": total_revenue,
        "pending": pending,
        "inProgress": in_progress,
        "completed": completed
    })

# ---------------- RUN APP ----------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
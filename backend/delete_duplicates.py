# delete_duplicates.py
from app import app, db, Job
from sqlalchemy import func

with app.app_context():
    print("Scanning for duplicate jobs...")

    # Find duplicates: same customer + vehicle (case-insensitive)
    duplicates = db.session.query(
        func.lower(Job.customer_name),
        func.lower(Job.vehicle_reg),
        func.count(Job.id).label('count'),
        func.min(Job.id).label('keep_id')
    ).group_by(
        func.lower(Job.customer_name),
        func.lower(Job.vehicle_reg)
    ).having(func.count(Job.id) > 1).all()

    deleted = 0

    for dup in duplicates:
        name_lower, reg_lower, count, keep_id = dup
        print(f"\nFound {count} jobs for same customer + vehicle. Keeping ID: {keep_id}")

        # Find all matching jobs except the one to keep
        to_delete = Job.query.filter(
            func.lower(Job.customer_name) == name_lower,
            func.lower(Job.vehicle_reg) == reg_lower,
            Job.id != keep_id
        ).all()

        for job in to_delete:
            print(f"  → Deleting Job ID: {job.id} | {job.customer_name} - {job.vehicle_reg}")
            db.session.delete(job)
            deleted += 1

    db.session.commit()
    print(f"\nSUCCESS: Deleted {deleted} duplicate jobs.")
    print("You can now add new jobs safely.")

from pymongo import MongoClient

from config import MONGODB_URI, DATABASE_NAME

client = MongoClient(MONGODB_URI)

db = client[DATABASE_NAME]

company_collection = db["companies"]

individual_collection = db["individuals"]

projects_collection = db["projects"]
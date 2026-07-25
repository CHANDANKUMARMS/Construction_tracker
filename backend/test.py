from pymongo import MongoClient

client = MongoClient("mongodb+srv://chandankumarms:Hanuman%40123@cluster0.vwjiah8.mongodb.net/?appName=Cluster0")

print(client.admin.command("ping"))
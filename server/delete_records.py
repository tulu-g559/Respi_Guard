import os
from pinecone import Pinecone

##Dont run this file directly## ==========================
##Everything here is just for deleting all records in Pinecone##

# Initialize Pinecone client
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# Target your index
index_name = os.getenv("PINECONE_INDEX")
index = pc.Index(index_name)

# 1. To delete all records from the default namespace:
index.delete(delete_all=True, namespace='')
import os
import time
import numpy as np
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import torch
from sentence_transformers import SentenceTransformer
import psycopg2
import chromadb

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask
app = Flask(__name__)

# Enable CORS for the Flask app
CORS(app)

# Load the pre-trained model
model = SentenceTransformer('all-mpnet-base-v2')
model.eval()

# Setup chromadb client
client = chromadb.PersistentClient(path=r'C:\Users\amanu\Downloads\govConSearch\chromadb')  # Replace with your path

# Set up a connection to the PostgreSQL database
def connect_to_database():
    return psycopg2.connect(
        dbname='govconsearch',
        user='postgres',
        password='',
        host='localhost'
    )

def load_data_from_database(notice_ids):
    connection = connect_to_database()
    # Convert list of IDs to tuple for SQL "IN" clause
    ids_tuple = tuple(notice_ids)
    sql_query = f"SELECT * FROM contracts WHERE noticeid IN {ids_tuple}" 
    data_frame = pd.read_sql_query(sql_query, connection)
    connection.close()
    return data_frame


# Function to search embeddings in chromadb
def search_embeddings(embedding, collection_name):
    collection = client.get_collection(name=collection_name)
    query_embedding = embedding.numpy().astype('float32').tolist()
    results = collection.query(
        query_embeddings=[query_embedding]
    )
    return results

@app.route('/search', methods=['GET'])
def search():
    query_start_time = time.time()
    query = request.args.get('query')
    
    query_embedding = model.encode(query, convert_to_tensor=True)
    
    start_time = time.time()
    title_results = search_embeddings(query_embedding, "title-embeddings")
    psc_results = search_embeddings(query_embedding, "psc-embeddings")
    naics_results = search_embeddings(query_embedding, "naics-embeddings")
    end_time = time.time()
    duration = end_time - start_time
    logger.info(f"search_embeddings took {duration:.4f} seconds to complete")


    # Weights for each embedding
    weights = {
        'title': 0.5,
        'psc': 0.25,
        'naics': 0.25
    }


    # Here, we're just using the title results. You can implement a strategy to combine results.
    # Combine the results based on weights
    combined_scores = {}
    for idx, notice_id in enumerate(title_results['ids'][0]):
        combined_scores[notice_id] = (
            weights['title'] * title_results['distances'][0][idx] +
            weights['psc'] * psc_results['distances'][0][idx] +
            weights['naics'] * naics_results['distances'][0][idx]
        )

    # Sort notice IDs based on the combined scores in descending order
    sorted_notice_ids_scores = sorted(combined_scores.items(), key=lambda item: item[1], reverse=True)


    # Retrieve the top notice IDs
    top_notice_ids = [item[0] for item in sorted_notice_ids_scores] # Adjust this number as needed

    # Fetch corresponding details for top results from PostgreSQL
    top_results = load_data_from_database(top_notice_ids)

    print("Top results sorted by their scores:")
    for notice_id, score in sorted_notice_ids_scores:  # You can limit the number of printed results here
        # Fetch the title from the results data frame
        title = top_results.loc[top_results['noticeid'] == notice_id, 'title'].iloc[0]
        print(f"Notice ID: {notice_id}, Title: {title}, Score: {score}")

   # print(top_results)
    start_time2 = time.time()
    results = []
    for _, row in top_results.iterrows():
        results.append({
            'Title': row['title'],
            'Link': row['link'],
            'Description': row['description'],
            'Score': combined_scores.get(row['noticeid'], 0)
        })
    end_time2 = time.time()
    duration2 = end_time2 - start_time2
    logger.info(f"sql took {duration2:.4f} seconds to complete")
    logger.info(f"Query processed in {time.time() - query_start_time:.2f} seconds")
    print(jsonify(results))
    return jsonify(results)

if __name__ == '__main__':
    start_time = time.time()
    app.run(debug=True)
    logger.info(f"Server started in {time.time() - start_time:.2f} seconds")

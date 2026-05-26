import difflib
import pickle
import json
import numpy as np
import pandas as pd
import sys

movies_data = pd.read_csv('movies.csv')
movie_name = sys.argv[1]

list_of_all_titles = movies_data['title'].tolist()

find_close_match = difflib.get_close_matches(movie_name, list_of_all_titles)

close_match = find_close_match[0]

index_of_the_movie = movies_data[movies_data.title == close_match]['index'].values[0]


with open('similarity_matrix.pkl', 'rb') as f:
    similarity = pickle.load(f)

similarity_score = list(enumerate(similarity[index_of_the_movie]))

sorted_similar_movies = sorted(similarity_score, key = lambda x:x[1], reverse = True)



suggested_movie_list_id=[]


i = 1

for movie in sorted_similar_movies:
  index = movie[0]
  title_from_index = movies_data[movies_data.index==index]['id'].values[0]
  if (i<30):
    suggested_movie_list_id.append(int(title_from_index))
    i+=1


json_data = json.dumps(suggested_movie_list_id)
print(json_data)



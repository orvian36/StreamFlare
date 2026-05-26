import sys
import json
import difflib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def main():
    payload = json.loads(sys.stdin.read())
    movie_title = payload["movieTitle"]
    movies = payload["movies"]
    limit = int(payload.get("limit", 20))

    titles = [m["title"] for m in movies]
    if not titles:
        print(json.dumps([]))
        return

    close = difflib.get_close_matches(movie_title, titles)
    if not close:
        print(json.dumps([]))
        return

    target_title = close[0]
    target_idx = titles.index(target_title)

    vectorizer = TfidfVectorizer()
    matrix = vectorizer.fit_transform(titles)
    sim = cosine_similarity(matrix[target_idx], matrix).flatten()

    ranked_idx = sim.argsort()[::-1].tolist()
    recommended_ids = []
    for i in ranked_idx:
        if i == target_idx:
            continue
        recommended_ids.append(int(movies[i]["id"]))
        if len(recommended_ids) >= limit:
            break

    print(json.dumps(recommended_ids))


if __name__ == "__main__":
    main()

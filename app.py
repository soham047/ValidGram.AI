from flask import Flask, request, jsonify, render_template
import instaloader
import numpy as np
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# Set the secret key for CSRF protection
app.secret_key = 'django-insecure-9kd1^6fjs$2t3rwjpzzf9#*3-ohw5zzu6wd36io9gsppvu5euv'

# Importing ML models
model = joblib.load('models/model5.joblib')
sc = joblib.load('models/StdScale (2).joblib')

# Instaloader Session Management
loader = instaloader.Instaloader()

def login_instaloader():
    try:
        # Load session from file if exists
        loader.load_session_from_file('sirenhead943')  # Change 'sirenhead943' to your username
    except FileNotFoundError:
        # If session file doesn't exist, log in and save the session
        loader.login("sirenhead943", "Headsiren943@")  # Use your actual username and password
        loader.save_session_to_file()  # Save session to file for later use

# Call the login function once at the start of the app
login_instaloader()

# Data scraping function
def scrape_insta(username):
    try:
        # Scrape profile data using the session
        profile = instaloader.Profile.from_username(loader.context, username)

        data = {
            "username": profile.username,
            "fullname": profile.full_name,
            "bio": profile.biography,
            "followers_count": profile.followers,
            "following_count": profile.followees,
            "posts_count": profile.mediacount,
            "isPriv": profile.is_private,
            "pfp": profile.profile_pic_url is not None,
            "external_url": profile.external_url is not None
        }
        return data
    except Exception as e:
        print(f"Error: {e}")
        return None


def num_len(s):
    c = 0
    for i in s:
        if i.isnumeric():
            c += 1
    return round((c / len(s)), 2)


def calculate_length_ratio(row):
    return len(row['fullname']) / len(row['username']) if len(row['username']) > 0 else 0


# Checking for similarity between username and real name using ML model
def calculate_cosine_similarity(row):
    if not row['fullname'] or not row['username']:
        return 0.0
    vectorizer = TfidfVectorizer(analyzer='char', ngram_range=(2, 3))
    vectors = vectorizer.fit_transform([row['fullname'], row['username']])
    return cosine_similarity(vectors)[0][1]


def chk_sim(d):
    b = pd.DataFrame(d, index=[0])
    b['cosine_similarity'] = b.apply(calculate_cosine_similarity, axis=1)
    b['length_ratio'] = b.apply(calculate_length_ratio, axis=1)
    a = b[['cosine_similarity', 'length_ratio']]
    return model.predict(a)[0]


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/check_profile', methods=["POST"])
def check_profile():
    if request.method == "POST":
        try:
            # Parse the JSON request
            username = request.form.get('username')
            d = scrape_insta(username)

            if d is None:
                return jsonify({"status": "error", "message": "User not found"})

            data = {}
            data['profile_pic'] = 1 if d['pfp'] is True else 0
            data['ratio_numlen_username'] = num_len(d['username'])
            data['ratio_numlen_fullname'] = num_len(d['fullname'])
            data['sim_name_username'] = chk_sim(d)
            data['len_desc'] = len(d['bio'])
            data['extern_url'] = 1 if d['external_url'] is True else 0
            data['private'] = 1 if d['isPriv'] is True else 0
            data['num_posts'] = d['posts_count']
            data['num_followers'] = d['followers_count']
            data['num_following'] = d['following_count']

            data_df = pd.DataFrame({k: [v] for k, v in data.items()})

            # Scaling the necessary columns
            scaled_columns = ['len_desc', 'num_posts', 'num_following', 'num_followers']
            data_df[scaled_columns] = sc.transform(data_df[scaled_columns])

            # Loading the prediction model
            pred_model = joblib.load('models/pred_model.joblib')
            res = pred_model.predict(data_df)

            if res == 1:
                prediction = "Suspicious Account Detected"
            else:
                prediction = "No Suspicious Activity Detected"

            d['pfp'] = 'Present' if d['pfp'] == True else "Not Present"
            d['isPriv'] = 'Private' if d['isPriv'] is True else "Public"
            if d['external_url'] is True:
                d['external_url'] = "Available"
            elif d['external_url'] is False or d['external_url'] == "None" or d['external_url'] == 'undefined':
                d['external_url'] = "Not Available"

            return jsonify({"result": prediction, "profile_data": d})

        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400
    return jsonify({"status": "error", "message": "Invalid request method."}), 405


if __name__ == "__main__":
    app.run(debug=True)

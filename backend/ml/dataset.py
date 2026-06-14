import random
import csv
import os
import pandas as pd
import numpy as np

NAMES = [
    "Ravi Kumar", "Priya Sharma", "Amit Singh", "Sunita Devi", "Rajesh Yadav",
    "Meena Kumari", "Arun Patel", "Kavitha Nair", "Suresh Babu", "Lakshmi Reddy",
    "Mohan Das", "Geeta Verma", "Deepak Joshi", "Anita Gupta", "Ramesh Iyer",
    "Shalini Mehta", "Vijay Krishnan", "Pooja Mishra", "Santosh Pandey", "Rekha Tiwari",
    "Abdul Raheem", "Fatima Begum", "Mohammed Ali", "Zainab Khan", "Imran Sheikh",
    "Saritha Pillai", "Biju Thomas", "Lijo Joseph", "Asha Mathew", "Saji George",
    "Nirmal Sahu", "Champa Devi", "Gopal Mahato", "Sarita Oraon", "Budhan Munda",
    "Lalita Besra", "Ratan Tudu", "Phulmani Hembram", "Chandu Murmu", "Sumitra Kisku",
    "David Fernandez", "Mary D'Souza", "John Pereira", "Angela Rodrigues", "Peter Gomes",
    "Harbhajan Kaur", "Gurpreet Singh", "Manpreet Kaur", "Balwinder Dhaliwal", "Jaswant Dhami",
    "Tenzin Dorje", "Pema Lhamo", "Karma Wangchuk", "Sonam Tobgyal", "Dawa Zangmo",
    "Nirmala Chhetri", "Dil Bahadur", "Maya Tamang", "Bikash Rai", "Sarita Gurung",
    "Aruna Devi", "Prakash Rao", "Usha Rani", "Srinivas Murthy", "Padmavathi",
    "Kiran Bhat", "Nagesh Shetty", "Savitha Kamath", "Sudhir Hegde", "Vimala Rao",
    "Rohan Desai", "Sneha Kulkarni", "Mahesh Patil", "Swati Jadhav", "Akash More",
    "Poonam Shinde", "Santosh Wagh", "Rekha Bhosale", "Sunil Mane", "Varsha Salvi",
    "Tariq Ahmed", "Rukhsana Parveen", "Salim Khan", "Nazia Sultana", "Arshad Hussain",
    "Deepa Nambiar", "Vishnu Namboothiri", "Sujatha Menon", "Rajeev Pillai", "Bindhu Krishnan",
    "Jagdish Prasad", "Shanti Devi", "Birendra Kumar", "Savitri Devi", "Dhiraj Yadav",
    "Komal Soni", "Harish Trivedi", "Pushpa Agarwal", "Naresh Saxena", "Madhu Kapoor",
    "Lalremsiami", "Zothansangi", "Lalpekhlua", "Malsawmi", "Zarzoliana",
    "Rani Borah", "Dipak Kalita", "Junmoni Devi", "Bikul Das", "Ranjit Sarma",
    "Chameli Devi", "Subal Ghosh", "Minati Roy", "Tapan Mondal", "Purnima Biswas",
    "Esther Dkhar", "Banshanlang Mawrie", "Pynhunlang Khongwir", "Aidalin Nongbri",
]

EMPLOYMENT_STATUSES = ["Unemployed", "Part-time", "Self-employed", "Employed"]
EDUCATION_LEVELS = [
    "No Formal Education", "Primary", "Secondary", "Undergraduate", "Postgraduate"
]

EDUCATION_RANK = {
    "No Formal Education": 0,
    "Primary": 1,
    "Secondary": 2,
    "Undergraduate": 3,
    "Postgraduate": 4,
}

EMPLOYMENT_RANK = {
    "Unemployed": 0,
    "Part-time": 1,
    "Self-employed": 2,
    "Employed": 3,
}


def _determine_eligibility(age, income, members, employment, education, disability):
    score = 0

    if income < 100000:
        score += 4
    elif income < 200000:
        score += 3
    elif income < 300000:
        score += 1

    if employment == "Unemployed":
        score += 3
    elif employment == "Part-time":
        score += 2
    elif employment == "Self-employed":
        score += 1

    if members >= 6:
        score += 2
    elif members >= 4:
        score += 1

    if disability == "Yes":
        score += 2

    edu_rank = EDUCATION_RANK[education]
    if edu_rank <= 1:
        score += 2
    elif edu_rank == 2:
        score += 1

    if age < 18 or age > 60:
        score += 1

    noise = random.uniform(-0.5, 0.5)
    return "Eligible" if (score + noise) >= 5 else "Not Eligible"


def generate_dataset(n: int = 250, seed: int = 42) -> pd.DataFrame:
    random.seed(seed)
    np.random.seed(seed)

    used_names = set()
    records = []

    name_pool = NAMES.copy()
    random.shuffle(name_pool)

    for i in range(n):
        base_name = name_pool[i % len(name_pool)]
        suffix = f" {i // len(name_pool) + 1}" if i >= len(name_pool) else ""
        name = base_name + suffix
        used_names.add(name)

        age = int(np.random.randint(16, 66))
        income = int(np.random.choice(
            [
                np.random.randint(30000, 120000),
                np.random.randint(120000, 300000),
                np.random.randint(300000, 600000),
            ],
            p=[0.45, 0.35, 0.20],
        ))
        members = int(np.random.choice(range(1, 11), p=[0.05, 0.10, 0.15, 0.20, 0.18, 0.13, 0.09, 0.05, 0.03, 0.02]))
        employment = random.choices(
            EMPLOYMENT_STATUSES,
            weights=[0.35, 0.25, 0.20, 0.20],
        )[0]
        education = random.choices(
            EDUCATION_LEVELS,
            weights=[0.10, 0.20, 0.30, 0.30, 0.10],
        )[0]
        disability = random.choices(["Yes", "No"], weights=[0.15, 0.85])[0]

        eligibility = _determine_eligibility(age, income, members, employment, education, disability)

        records.append({
            "applicant_name": name,
            "age": age,
            "family_income": income,
            "family_members": members,
            "employment_status": employment,
            "education_level": education,
            "disability_status": disability,
            "eligibility_status": eligibility,
        })

    return pd.DataFrame(records)


DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "beneficiaries.csv")


def load_or_generate(path: str = DATA_PATH) -> pd.DataFrame:
    path = os.path.abspath(path)
    if not os.path.exists(path):
        df = generate_dataset()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        df.to_csv(path, index=False)
    return pd.read_csv(path)


def save_dataset(df: pd.DataFrame, path: str = DATA_PATH):
    path = os.path.abspath(path)
    df.to_csv(path, index=False)

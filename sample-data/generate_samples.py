import pandas as pd
import numpy as np

np.random.seed(42)
n = 250

customer_ids = [f'CUST-{1000+i}' for i in range(n)]
first_names = ['Aarav', 'Diya', 'Rohan', 'Ananya', 'Vivaan', 'Isha', 'Aditya', 'Meera', 'Kabir', 'Sanya',
               'Arjun', 'Pooja', 'Rahul', 'Sneha', 'Vikram', 'Tanvi', 'Kunal', 'Neha', 'Siddharth', 'Riya',
               'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Sam', 'Chris', 'Pat', 'Jamie', 'Robin']
last_names = ['Sharma', 'Verma', 'Patel', 'Gupta', 'Mehta', 'Singh', 'Chopra', 'Joshi', 'Bhatia', 'Malhotra',
              'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor']

names = [f"{np.random.choice(first_names)} {np.random.choice(last_names)}" for _ in range(n)]
emails = [f"{name.lower().replace(' ', '.')}@example.com" for name in names]
genders = np.random.choice(['Female', 'Male'], size=n, p=[0.54, 0.46])
ages = np.random.randint(18, 70, size=n)

cluster_type = np.random.choice([0, 1, 2, 3, 4], size=n, p=[0.2, 0.15, 0.2, 0.25, 0.2])

incomes = []
spending_scores = []
frequencies = []
recencies = []

for c in cluster_type:
    if c == 0:
        inc = np.random.normal(28, 7)
        sp = np.random.normal(22, 8)
        freq = np.random.randint(1, 4)
        rec = np.random.randint(60, 180)
    elif c == 1:
        inc = np.random.normal(26, 6)
        sp = np.random.normal(78, 10)
        freq = np.random.randint(5, 12)
        rec = np.random.randint(5, 45)
    elif c == 2:
        inc = np.random.normal(88, 12)
        sp = np.random.normal(20, 8)
        freq = np.random.randint(2, 6)
        rec = np.random.randint(40, 120)
    elif c == 3:
        inc = np.random.normal(92, 14)
        sp = np.random.normal(82, 9)
        freq = np.random.randint(10, 24)
        rec = np.random.randint(1, 30)
    else:
        inc = np.random.normal(55, 10)
        sp = np.random.normal(50, 10)
        freq = np.random.randint(4, 9)
        rec = np.random.randint(15, 75)
    
    incomes.append(max(15, min(140, round(float(inc), 1))))
    spending_scores.append(max(1, min(99, int(sp))))
    frequencies.append(freq)
    recencies.append(rec)

total_spends = [round(float(incomes[i] * spending_scores[i] * 0.45 + np.random.uniform(50, 200)), 2) for i in range(n)]

df = pd.DataFrame({
    'CustomerID': customer_ids,
    'CustomerName': names,
    'Email': emails,
    'Age': ages,
    'Gender': genders,
    'AnnualIncome': incomes,
    'SpendingScore': spending_scores,
    'TotalSpend': total_spends,
    'PurchaseFrequency': frequencies,
    'RecencyDays': recencies
})

df.to_csv('sample-data/Ecommerce_Customer_Segments.csv', index=False)

df_classic = df[['CustomerID', 'Gender', 'Age', 'AnnualIncome', 'SpendingScore']].rename(columns={
    'AnnualIncome': 'Annual Income (k$)',
    'SpendingScore': 'Spending Score (1-100)'
})
df_classic.to_csv('sample-data/Mall_Customers.csv', index=False)
print('Generated sample datasets successfully!')

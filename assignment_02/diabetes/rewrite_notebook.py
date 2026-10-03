import json

rewrites = {
    0: """# Application 1: Diabetes Prediction — Assignment 02

**Student:** _<your name>_ &nbsp;&nbsp; **ID:** _<your id>_ &nbsp;&nbsp; **Class:** _<class>_
&nbsp;&nbsp; **Date:** 2026-08-29

This notebook details the creation of a diabetes screening tool. It starts with raw survey data and ends with a serialized machine learning model, which is later utilized by web and mobile applications directly. The structure aligns with the 23-section requirement of the assignment, following this workflow:

```
Data → Understand → Clean → Represent → Learn → Evaluate → Persist → Deploy
```

Brief explanations accompany each calculation and output.

## 0. Environment Setup

We define our environment here to ensure reproducibility. A global `RANDOM_SEED` is used for all probabilistic operations, and we log the versions of key libraries for the final report.""",
    2: """## 1. Problem Definition

### 1.1 Real-World Context

Large-scale public health programs often need a way to screen the adult population to identify those who should undergo further testing or lifestyle interventions. Since laboratory data isn't available upfront, these screenings rely on self-reported questionnaires. The CDC's Behavioral Risk Factor Surveillance System (BRFSS) conducts such surveys annually via telephone. This project builds a model using around 250,000 of these survey responses to predict which individuals are most likely to have diabetes or pre-diabetes.

### 1.2 Machine Learning Task

We frame this as a binary **classification** problem. The input `X` consists of 21 survey responses per individual (detailed in Section 1.3). Our target variable `y` is `Diabetes_binary`, derived from the original `Diabetes_012` column. We map "no diabetes" (0) to the negative class, while combining "pre-diabetes" (1) and "diabetes" (2) into a single positive class. We group the latter two because both require the same follow-up action, and the pre-diabetes group is too small (1.8%) to train a reliable separate class.

### 1.3 Feature Dictionary

Below are the 21 features based on the UCI Machine Learning Repository's documentation for this CDC dataset. Almost all features are numeric or integer-encoded categories, stored as `float64`.

| # | Feature | Type | Range / Units | Description |
|---|---|---|---|---|
| — | `Diabetes_012` | Target | 0 / 1 / 2 | 0 = None, 1 = Pre-diabetes, 2 = Diabetes. Binarized into `Diabetes_binary` (0 vs 1+2). |
| 1 | `HighBP` | Binary | 0 / 1 | Diagnosed with **high blood pressure**. |
| 2 | `HighChol` | Binary | 0 / 1 | Diagnosed with **high cholesterol**. |
| 3 | `CholCheck` | Binary | 0 / 1 | **Cholesterol checked** within the past 5 years. |
| 4 | `BMI` | Continuous | kg/m² | **Body Mass Index** calculated from height and weight. |
| 5 | `Smoker` | Binary | 0 / 1 | Smoked **100+ cigarettes** in lifetime. |
| 6 | `Stroke` | Binary | 0 / 1 | History of **stroke**. |
| 7 | `HeartDiseaseorAttack` | Binary | 0 / 1 | History of **coronary heart disease or heart attack**. |
| 8 | `PhysActivity` | Binary | 0 / 1 | Engaged in **physical activity** outside of work in the last 30 days. |
| 9 | `Fruits` | Binary | 0 / 1 | Consumes **fruit daily**. |
| 10 | `Veggies` | Binary | 0 / 1 | Consumes **vegetables daily**. |
| 11 | `HvyAlcoholConsump` | Binary | 0 / 1 | **Heavy drinker**: ≥14 drinks/week (men) or ≥7 (women). |
| 12 | `AnyHealthcare` | Binary | 0 / 1 | Possesses **health insurance** or coverage. |
| 13 | `NoDocbcCost` | Binary | 0 / 1 | Couldn't see a doctor in the past year due to **cost**. |
| 14 | `GenHlth` | Ordinal | 1–5 | Self-assessed health: **1=Excellent to 5=Poor**. |
| 15 | `MentHlth` | Count | 0–30 | Days of **poor mental health** in the past 30 days. |
| 16 | `PhysHlth` | Count | 0–30 | Days of **poor physical health** in the past 30 days. |
| 17 | `DiffWalk` | Binary | 0 / 1 | Experiences **difficulty walking** or climbing stairs. |
| 18 | `Sex` | Binary | 0 / 1 | Respondent's sex: **0=Female, 1=Male**. |
| 19 | `Age` | Ordinal | 1–13 | 5-year **age bracket**: 1=18–24 up to 13=80+. |
| 20 | `Education` | Ordinal | 1–6 | Education level: 1=None up to 6=College grad. |
| 21 | `Income` | Ordinal | 1–8 | Income bracket: 1=<10k up to 8=≥75k. |

Four features (`GenHlth`, `Age`, `Education`, `Income`) are ordinal and preserve real-world rankings, meaning they have a monotonic relationship with risk (as validated in Section 10). The dataset is purely tabular with no text fields.""",
    3: """## 2. Dataset Origin

We are using the **Diabetes Health Indicators Dataset** (`diabetes_012_health_indicators_BRFSS2015.csv`), available via Kaggle and the UCI Machine Learning Repository. As a product of a US government survey, it's public domain data. Our copy was acquired on 2026-08-29.

This data is derived from the **2015 CDC BRFSS** telephone survey. The creator filtered it down to 21 diabetes-related factors. We use the 3-class version, where `Diabetes_012` labels no diabetes, pre-diabetes, and diabetes. All answers are self-reported. Some values (like age, income, health) are binned by the CDC, while "don't know/refused" responses were discarded by the dataset author.

The raw CSV file is located at `diabetes/data/diabetes_012_health_indicators_BRFSS2015.csv`. It contains float64 values and a single header row.""",
    4: "## 3. Data Loading",
    6: "The dataset loads successfully. It features the target label `Diabetes_012` followed by the 21 survey predictors. All data is pre-encoded numerically, eliminating the need for type conversion. Every row represents a single respondent's answers.",
    7: "## 4. Initial Inspection",
    9: "The DataFrame has a shape of `(253680, 22)`, equating to **253,680 records** and **22 columns**. Even though most features are categorical, everything is typed as `float64`.\n\nThere are no explicitly missing values (`isna().sum()` is 0). However, `duplicated().sum()` reveals 23,899 identical rows (roughly 9.4%), which we will address in Section 7. `BMI` shows an extreme upper limit of 98, while the `MentHlth` and `PhysHlth` columns span from 0 to 30. The target variable is severely imbalanced, heavily skewing towards class 0 (213,703 cases).",
    10: "## 5. Data Quality Assessment",
    12: "The dataset is remarkably clean: no missing values, no unstructured text, and consistent data types. However, we note three issues to handle:\n\n1.  **Exact Duplicates**: 23,899 rows are duplicates and will be removed in Section 7 to prevent data leakage and bias. This slightly increases the positive class ratio to 17.3%.\n2.  **Extreme BMI Values**: The upper bounds of `BMI` are investigated in Section 9. We decide to retain them.\n3.  **Class Imbalance**: Addressed later through stratified splitting, balancing weights, and selecting appropriate metrics (F1/Recall/ROC-AUC) instead of accuracy.\n\nThe rightward skew in the mental and physical health columns is biologically plausible and treated as valid data.",
    13: "## 6. Missing Values",
    15: "Because there are zero missing values, we don't need to drop any columns or rows. \n\nWe still include a `SimpleImputer(strategy=\"median\")` in our pipeline (Section 15). Although it doesn't change the training data, it ensures our deployed application won't crash if a user leaves a field blank—it will simply substitute the training median. This guarantees identical behavior during training and inference.",
    16: "## 7. Handling Duplicates",
    18: "Lacking a unique respondent ID, we can only find duplicates by looking for fully identical rows. We found 23,899 of them (9.4% of the dataset).\n\nWe drop these *before* splitting the data. While some might be genuine coincidental matches due to the binary nature of the survey, we can't distinguish them from actual double-entries. If a duplicate row appeared in both train and test sets, the model's test performance would be artificially inflated due to memorization. Removing them also prevents common profiles from dominating the training process. We proceed with the remaining 229,781 rows.",
    19: "## 8. Value Validation",
    21: "We check whether each column's values lie within their expected definitions. All categorical and binary fields pass this check.\n\n`BMI` is the only column showing questionable extremes. A few records have a BMI under 14 or over 80. While extreme, values up to 80 represent severe real-world obesity. We explore the impact of these extreme BMIs in Section 9 and decide to keep them unaltered.",
    22: "## 9. Outlier Investigation",
    24: "Table 9a shows the distribution of extreme `BMI` values. Values under 14 or over 80 make up a tiny fraction of the data. The 60–80 range makes up 0.25% of rows and exhibits an above-average diabetes rate, suggesting these are genuine high-risk individuals, not errors.\n\nOur modeling approach makes clipping unnecessary: we standardize numeric features, preventing linear models from being skewed, and our final deployed model is tree-based, which only cares about the rank order of values, not their magnitude. Appendix A proves that clipping or dropping these outliers has negligible impact on performance.\n\nThe `MentHlth` and `PhysHlth` columns flag as outliers via the IQR method simply because they are heavily skewed toward 0, but values up to 30 are perfectly valid answers. Therefore, we keep all records as they are.",
    25: "## 10. Exploratory Data Analysis (EDA)",
    28: "We generated five plots to understand the data distribution and relationships.\n\n**1. Target Class Imbalance (Bar Chart):**\n*Observation:* Positive cases (39,726) are far outnumbered by negative ones (190,055).\n*Implication:* A naive model guessing 'negative' would achieve 83% accuracy. We must use stratified splitting and evaluate using Recall, F1, and ROC-AUC rather than raw Accuracy.\n\n**2. BMI vs. Class (Violin Plot):**\n*Observation:* The median BMI is higher for the positive class (31 vs 27), but the distributions overlap significantly.\n*Implication:* BMI is a useful, but not perfectly separating, feature. We will scale it and keep it.\n\n**3. Diabetes Rate vs. Age (Line Plot):**\n*Observation:* Risk increases almost linearly with age, peaking at ages 65-74 before slightly dropping.\n*Implication:* Age is a strong predictor. Both linear and tree-based models will capture this trend effectively.\n\n**4. Diabetes Rate vs. Income (Bar Chart):**\n*Observation:* Lower income brackets show higher diabetes rates (28% at the lowest vs 11% at the highest).\n*Implication:* Income is a strong proxy for health outcomes. It remains a valuable predictive feature, though it highlights socioeconomic disparities.\n\n**5. Feature Correlation (Heatmap):**\n*Observation:* `GenHlth`, `HighBP`, `BMI`, and `Age` are most strongly correlated with diabetes. No two features are perfectly collinear (highest is `GenHlth` and `PhysHlth` at r ≈ 0.52).\n*Implication:* We don't need to drop any redundant columns. Linear models will handle the set well, and tree models will distribute importance across related factors.",
    29: "## 11. Feature Selection",
    31: "Our input space comprises 14 binary indicators, 4 ordinal categories, and 3 continuous variables. Our target is the newly engineered `Diabetes_binary`.\n\nWe immediately drop the raw `Diabetes_012` to prevent label leakage. We retain all other columns, leaving ordinal features as numeric since their inherent order is predictive.",
    32: "## 12. Data Representation\n\nThis section maps our dataset to the concepts introduced in Lecture 02. We treat each respondent as a feature vector $x \\in \\mathbb{R}^d$, forming the dataset matrix $X \\in \\mathbb{R}^{N \\times d}$. The pipeline is:\n\n```\nCSV -> DataFrame -> Feature Matrix -> Scaled Matrix -> Model Input\n```\n\nBelow, we print an example record transformation.",
    34: "Our final feature matrix `X` has the shape `(N, 23)` because we added two engineered columns. The numeric columns are median-imputed and scaled via `StandardScaler`, while the binary flags remain 0/1. No data is clipped or dropped.\n\nWe don't use One-Hot Encoding since all our categorical data is either binary or ordinal. Standardizing the numeric block ensures distance-based models (like KNN or SVM) perform optimally.",
    35: "## 13. Feature Engineering",
    37: "We engineer two new columns:\n1.  `TotalUnhealthyDays`: Combines mental and physical health days (capped at 60) for a holistic metric.\n2.  `CardioRisk`: A logical OR combining Stroke and Heart Disease, creating a denser cardiovascular risk flag.\n\nNo further encoding is needed. Our input dimension $d$ is now 23. These transformations are wrapped in a stateless `engineer()` function to easily replicate them in production.",
    38: "## 14. Data Splitting: Train, Validation, and Test",
    40: "We split the data into 70% training, 15% validation, and 15% testing, ensuring we use a stratified split to maintain the ~17.3% positive class ratio across all sets. We use `random_state=42` for reproducibility.\n\nCrucially, all preprocessing (like scaling and imputation) is fitted **only** on the training set to prevent data leakage. Duplicate removal was handled beforehand to ensure no test records accidentally inflated validation or training scores.",
    41: "## 15. Preprocessing Pipeline",
    43: "Our `ColumnTransformer` handles the data in two branches:\n1.  **Numeric Branch**: Applies median imputation followed by `StandardScaler` to ensure metrics like `BMI` and `Age` share a common scale.\n2.  **Binary Branch**: Passes the 0/1 indicators through unmodified.\n\nThe `make_preprocessor()` function generates a fresh pipeline. We fit it exclusively on the training data. This exact fitted object is saved and deployed to production, ensuring identical transformations during inference.",
    44: "## 16. Baseline Benchmarks",
    46: "We establish two baselines to measure true model performance:\n\n1.  **Majority Class Baseline**: Always predicts 'no diabetes'. This achieves ~83% accuracy but 0% recall and F1. This proves why accuracy is a flawed metric here.\n2.  **Simple Logistic Regression**: Uses only the top three features (`GenHlth`, `HighBP`, `BMI`). It yields an ROC-AUC of ~0.77. \n\nAny complex model we select in Section 17 must significantly outperform this 3-feature baseline to justify its deployment overhead.",
    47: "## 17. Model Training",
    48: "We evaluate five algorithms: Logistic Regression, Decision Tree, Random Forest, RBF SVM, and KNN.\n\nBecause the SVM scales poorly on large datasets, we train all models on a consistent stratified 25,000-row sample of the training set to ensure a fair comparison. Once a champion model is chosen, it will be retrained on the entire training set (Section 19) to maximize its predictive power before final evaluation.",
    50: "All models are trained with identical preprocessing on the 25k subset. Hyperparameters are tuned as follows:\n\n| Algorithm | Key Parameters |\n|---|---|\n| LogisticRegression | `max_iter=1000`, `class_weight=\"balanced\"` |\n| DecisionTree | `max_depth=6`, `min_samples_leaf=50`, `class_weight=\"balanced\"` |\n| RandomForest | `n_estimators=300`, `max_depth=12`, `min_samples_leaf=20`, `class_weight=\"balanced_subsample\"` |\n| SVM (RBF) | `C=1.0`, `gamma=\"scale\"`, `probability=True`, `class_weight=\"balanced\"` |\n| KNN | `n_neighbors=45`, `weights=\"distance\"` |",
    51: "## 18. Model Comparison",
    54: "The Random Forest leads the validation results with an ROC-AUC of ~0.81, closely followed by Logistic Regression at ~0.80. Both easily surpass the 3-feature baseline (0.77). KNN struggles significantly; lacking a built-in class weight mechanism, its recall drops to ~0.10, rendering it unusable for this imbalanced screening task.\n\nWhen we refit the Random Forest on the full dataset, its ROC-AUC and F1 score remain stable while recall improves slightly. This confirms our 25,000-row sample was representative enough for model selection. We will proceed with the Random Forest.",
    55: "## 19. Final Evaluation",
    57: "We test our fully trained Random Forest on the held-out test set.\n\nLooking at the confusion matrix:\n- **Top-Right (False Positives)**: People flagged for follow-up who don't have diabetes. This is acceptable for a screening tool.\n- **Bottom-Left (False Negatives)**: People with diabetes whom the model missed. This is the most dangerous error.\n\nBecause missing a diagnosis is worse than an unnecessary blood test, **Recall** is our primary metric. The model achieves ~0.74 Recall and ~0.81 ROC-AUC. We ignore the 72% Accuracy since our dummy baseline scored higher but was useless.",
    58: "## 20. Error Analysis",
    60: "By analyzing the model's mistakes, we find that False Negatives typically look like healthy individuals (average BMI, good self-reported health, no high BP). These errors stem from missing data—like genetics or diet—rather than algorithmic failure. \n\nConversely, False Positives are high-risk individuals (high BMI, high BP) who haven't developed diabetes yet. This is exactly what a screening tool should flag.\n\nTo improve this, we would need to add clinical measurements (like fasting glucose) to the survey, or lower our decision threshold if clinics have the capacity for more false alarms.",
    61: "## 21. Model Selection\n\nWe select the **Random Forest** for deployment based on its superior Recall and ROC-AUC.\n\n| Feature | Random Forest (Selected) | Logistic Regression (Fallback) |\n|---|---|---|\n| Performance | Best ROC-AUC (~0.81) and F1 (~0.48) | Marginally lower ROC-AUC (-0.01) |\n| Interpretability | Feature importance charts | Explicit odds-ratios via coefficients |\n| Speed | Sub-10ms per inference | Sub-1ms per inference |\n| Size | ~55MB (300 trees) | ~30KB |\n| Robustness | Handles outliers and non-linear interactions inherently | Requires strict scaling |\n\nThe Random Forest is fast enough for API use and handles nonlinearities well. Logistic regression is a capable fallback if artifact size becomes a constraint. SVM and KNN are discarded due to speed and performance issues.",
    62: "## 22. Model Persistence",
    64: "Before saving, we train the final pipeline on the combined training and validation sets, giving it maximum exposure to the data while keeping the test set untouched.\n\nWe export three files to `diabetes/model/`:\n1.  `model_pipeline.joblib`: The unified object holding the imputer, scaler, and Random Forest.\n2.  `feature_names.joblib`: The expected column order.\n3.  `input_schema.json`: A documentation contract defining the expected API payload.\n\nDuring inference, the API simply reconstructs the DataFrame, applies `engineer()`, and calls `.predict_proba()` on the pipeline.",
    65: "## 23. Inference Testing",
    67: "We perform a sanity check to ensure the saved model functions correctly without the notebook environment. We load the pipeline from disk, pass a mock JSON payload through our feature engineering function, and assert that the generated probability exactly matches the in-memory model from Section 22.\n\nThis guarantees our model is robust and ready for integration into the web and mobile backends.",
    68: "---\n\n## Appendix A — BMI Outlier Sensitivity",
    70: "Testing four different strategies for handling extreme BMIs (keeping all, clipping to 12-80, clipping to 14-60, dropping outliers) reveals virtually no difference in model performance (variance < 0.003 in ROC-AUC).\n\nSince the extreme values form a minuscule portion of the dataset, they don't drag down the model. Furthermore, our deployed Random Forest relies on value ranks rather than absolute magnitudes, making clipping irrelevant. We confidently keep all records as-is."
}

with open("notebook/diabetes.ipynb", "r", encoding="utf-8") as f:
    nb = json.load(f)

for i, cell in enumerate(nb["cells"]):
    if i in rewrites:
        # Update the cell source
        # The notebook format stores source as a list of strings (lines) or a single string.
        # We will write it as a list of strings with newlines.
        lines = [line + "\n" for line in rewrites[i].split("\n")]
        # Remove trailing newline from the last element to match standard Jupyter format
        if lines:
            lines[-1] = lines[-1].rstrip("\n")
        cell["source"] = lines

with open("notebook/diabetes.ipynb", "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1)

print("Successfully updated notebook with paraphrased explanations.")

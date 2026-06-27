# Emotion Intake Flow

This document explains how emotions are currently collected from the user and sent to the backend.

## 1. Data Source
The emotion hierarchy (Core → Secondary → Specific) is loaded from a static JSON file located at `public/data/emotions.json`.

## 2. User Interface
The application provides components (like `EmotionCheckIn` and `EmotionWheel`) that render this hierarchy. The user interacts with the UI to select a path of emotions. 
For example, a user might select `Sad` (Core) and then `Vulnerable` (Secondary). This results in a path array: `["Sad", "Vulnerable"]`.

## 3. Data Transformation (`src/lib/emotions.ts`)
The selected string array is passed to `pathToEmotionInput(path)`, which transforms it into an `EmotionInput` object expected by the backend.
- It maps the array elements to `core_emotion`, `secondary_emotion`, and (optionally) `specific_emotion`.
- It applies specific overrides (via `SECONDARY_OVERRIDES` and `SPECIFIC_OVERRIDES`) because the backend enum values sometimes differ from the UI labels. For example, the path `["Sad", "Vulnerable"]` is transformed so that the secondary emotion becomes `"Vulnerable_Sad"`.
- A default `intensity` of 3 is attached to the input.

## 4. API Submission (`src/lib/api.ts`)
The `EmotionInput` is sent to the backend through the `submitEmotionsAndGetQuote(userId, emotions)` function:
1. **Create Session:** A POST request is made to `/sessions` with the `user_id` and the array of selected emotions. This creates a new session in the database and returns a `session_id`.
2. **Generate Quote:** A POST request is then made to `/quotes` with the `session_id`. The backend uses the logged emotions to generate a personalized quote using an LLM.
3. The quote result is returned and displayed to the user in the UI.

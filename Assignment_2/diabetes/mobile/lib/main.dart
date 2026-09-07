import 'package:flutter/material.dart';

import 'api_client.dart';
import 'screens/questionnaire_screen.dart';

void main() => runApp(const DiabetesApp());

final ApiClient api = ApiClient();

/// One id per app launch, used to group this device's screenings in /history.
final String sessionId = 'mob-${DateTime.now().millisecondsSinceEpoch}';

class DiabetesApp extends StatelessWidget {
  const DiabetesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Diabetes Screening',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B0D17),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF38BDF8),
          secondary: Color(0xFF818CF8),
          surface: Color(0xFF141827),
          background: Color(0xFF0B0D17),
        ),
        useMaterial3: true,
        fontFamily: 'Roboto', // Or 'Outfit'/'Inter' if added to pubspec
        cardTheme: const CardThemeData(
          elevation: 2,
          margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.black.withOpacity(0.3),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF38BDF8), width: 2),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF38BDF8),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          ),
        ),
      ),
      home: const QuestionnaireScreen(),
    );
  }
}

/// Shared colour for a risk band.
Color bandColor(String band) {
  switch (band) {
    case 'High':
      return const Color(0xFFEF4444); // Neon Red
    case 'Moderate':
      return const Color(0xFFF59E0B); // Neon Orange
    default:
      return const Color(0xFF10B981); // Neon Green
  }
}

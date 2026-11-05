import 'package:flutter/material.dart';

import 'app_translations.dart';

/// Translates interface copy only. Names, messages and other user data should
/// continue to use Text rather than AppText.
String translateAppText(String source, String languageCode) {
  final index = const ['hi', 'ta', 'te', 'kn', 'ml', 'gu'].indexOf(languageCode);
  if (index < 0) return source;
  return appTranslations[source]?[index] ?? source;
}

extension AppStrings on BuildContext {
  String tr(String source) =>
      translateAppText(source, Localizations.localeOf(this).languageCode);
}

/// A const-friendly localized label. Depending on Localizations here also
/// updates labels on routes that were already open when the locale changed.
class AppText extends StatelessWidget {
  const AppText(
    this.data, {
    super.key,
    this.style,
    this.strutStyle,
    this.textAlign,
    this.textDirection,
    this.locale,
    this.softWrap,
    this.overflow,
    this.textScaler,
    this.maxLines,
    this.semanticsLabel,
    this.textWidthBasis,
    this.textHeightBehavior,
    this.selectionColor,
  });

  final String data;
  final TextStyle? style;
  final StrutStyle? strutStyle;
  final TextAlign? textAlign;
  final TextDirection? textDirection;
  final Locale? locale;
  final bool? softWrap;
  final TextOverflow? overflow;
  final TextScaler? textScaler;
  final int? maxLines;
  final String? semanticsLabel;
  final TextWidthBasis? textWidthBasis;
  final TextHeightBehavior? textHeightBehavior;
  final Color? selectionColor;

  @override
  Widget build(BuildContext context) => Text(
    context.tr(data),
    style: style,
    strutStyle: strutStyle,
    textAlign: textAlign,
    textDirection: textDirection,
    locale: locale,
    softWrap: softWrap,
    overflow: overflow,
    textScaler: textScaler,
    maxLines: maxLines,
    semanticsLabel: semanticsLabel == null ? null : context.tr(semanticsLabel!),
    textWidthBasis: textWidthBasis,
    textHeightBehavior: textHeightBehavior,
    selectionColor: selectionColor,
  );
}

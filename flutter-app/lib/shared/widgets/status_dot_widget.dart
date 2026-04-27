import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class StatusDotWidget extends StatelessWidget {
  final bool isOnline;
  final bool isOnCall;
  final bool isDND;
  final double size;

  const StatusDotWidget({
    super.key,
    required this.isOnline,
    this.isOnCall = false,
    this.isDND = false,
    this.size = 10,
  });

  Color get _color {
    if (!isOnline) return AppTheme.subtext;
    if (isDND) return AppTheme.warning;
    if (isOnCall) return AppTheme.secondary;
    return AppTheme.onlineDot;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: _color,
        shape: BoxShape.circle,
      ),
    );
  }
}

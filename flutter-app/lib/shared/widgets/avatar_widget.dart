import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class AvatarWidget extends StatelessWidget {
  final String? avatarId;
  final double size;
  final String? fallbackText;
  final bool isHost;
  final bool showOnlineDot;
  final bool isOnline;

  const AvatarWidget({
    super.key,
    this.avatarId,
    this.size = 48,
    this.fallbackText,
    this.isHost = false,
    this.showOnlineDot = false,
    this.isOnline = false,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppTheme.primary.withValues(alpha: 0.2),
          ),
          child: ClipOval(
            child: avatarId != null && avatarId!.isNotEmpty
                ? Image.network(
                    avatarId!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _fallback(),
                  )
                : _fallback(),
          ),
        ),
        if (showOnlineDot)
          Positioned(
            bottom: 2,
            right: 2,
            child: Container(
              width: size * 0.22,
              height: size * 0.22,
              decoration: BoxDecoration(
                color: isOnline ? AppTheme.onlineDot : AppTheme.subtext,
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.background, width: 2),
              ),
            ),
          ),
      ],
    );
  }

  Widget _fallback() {
    final initials = fallbackText != null && fallbackText!.isNotEmpty
        ? fallbackText![0].toUpperCase()
        : '?';
    return Center(
      child: Text(
        initials,
        style: TextStyle(
          color: AppTheme.primary,
          fontSize: size * 0.4,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}


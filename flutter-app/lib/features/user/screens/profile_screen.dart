import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final phone = user?.phoneNumber ?? 'Unknown';
    final initials =
        phone.length >= 2 ? phone.substring(phone.length - 2) : 'U';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        elevation: 0.5,
        title: Text(
          'My Profile',
          style: GoogleFonts.inter(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.primary),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
              return;
            }
            context.go('/home');
          },
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 16),
            // Profile Avatar
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.2),
                    blurRadius: 20,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  initials.toUpperCase(),
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            // User name
            Text(
              'Friendoo User',
              style: GoogleFonts.inter(
                color: AppColors.textPrimary,
                fontSize: 22,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            // Phone number
            Text(
              phone,
              style: GoogleFonts.inter(
                color: AppColors.textSecondary,
                fontSize: 14,
                fontWeight: FontWeight.w400,
              ),
            ),
            const SizedBox(height: 40),

            // Menu items
            _ProfileMenuItem(
              icon: Icons.account_balance_wallet_outlined,
              label: 'Wallet',
              onTap: () => context.push('/wallet'),
            ),
            _ProfileMenuItem(
              icon: Icons.call_outlined,
              label: 'Call History',
              onTap: () => context.push('/call-history'),
            ),
            _ProfileMenuItem(
              icon: Icons.settings_outlined,
              label: 'Settings',
              onTap: () => context.push('/settings'),
            ),
            _ProfileMenuItem(
              icon: Icons.help_outline,
              label: 'Help & Support',
              onTap: () {},
            ),
            _ProfileMenuItem(
              icon: Icons.info_outline,
              label: 'About',
              onTap: () {},
            ),
            const Divider(height: 40),
            // Logout
            _ProfileMenuItem(
              icon: Icons.logout_outlined,
              label: 'Logout',
              isDestructive: true,
              onTap: () async {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: Text(
                      'Logout',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                    ),
                    content: Text(
                      'Are you sure you want to logout?',
                      style: GoogleFonts.inter(color: AppColors.textSecondary),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: Text(
                          'Cancel',
                          style: GoogleFonts.inter(color: AppColors.primary),
                        ),
                      ),
                      TextButton(
                        onPressed: () async {
                          await FirebaseAuth.instance.signOut();
                          if (context.mounted) context.go('/login');
                        },
                        child: Text(
                          'Logout',
                          style: GoogleFonts.inter(color: AppColors.error),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  const _ProfileMenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? AppColors.error : AppColors.textPrimary;
    final iconColor = isDestructive ? AppColors.error : AppColors.primary;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        leading: Icon(icon, color: iconColor, size: 22),
        title: Text(
          label,
          style: GoogleFonts.inter(
            color: color,
            fontWeight: FontWeight.w500,
            fontSize: 15,
          ),
        ),
        trailing: isDestructive
            ? null
            : Icon(
                Icons.chevron_right,
                color: AppColors.textSecondary,
                size: 20,
              ),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );
  }
}

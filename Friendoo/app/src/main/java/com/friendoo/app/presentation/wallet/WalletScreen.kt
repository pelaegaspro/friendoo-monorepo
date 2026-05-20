package com.friendoo.app.presentation.wallet

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.LocalOffer
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.SwapVert
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import com.friendoo.app.presentation.theme.DarkCard
import com.friendoo.app.presentation.theme.GradientEnd
import com.friendoo.app.presentation.theme.GradientStart
import com.friendoo.app.presentation.theme.LightCard
import com.friendoo.app.presentation.theme.LocalFriendooColors
import com.friendoo.app.presentation.theme.Mint
import com.friendoo.app.presentation.theme.RosePink
import com.friendoo.app.presentation.theme.SoftPurple
import com.friendoo.app.presentation.theme.WarmCoral

private val ConnectoBlue = Color(0xFF4A7DF0)
private val ConnectoGreen = Color(0xFF27C044)
private val ConnectoRed = Color(0xFFFF4054)
private val ConnectoText = Color(0xFF111111)
private val ConnectoMuted = Color(0xFF777777)
private val ConnectoBgTop = Color(0xFFFFD6DA)
private val ConnectoBgBottom = Color(0xFFE4ECFF)
private val ConnectoCard = Color.White
private val ConnectoCardShape = RoundedCornerShape(14.dp)
private val Rupee = "\u20B9"

@Composable
private fun ConnectoBackground(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.background(
            Brush.verticalGradient(listOf(ConnectoBgTop, ConnectoBgBottom))
        )
    )
}

@Composable
fun WalletScreen(
    userViewModel: WalletViewModel = hiltViewModel(),
    hostViewModel: HostWalletViewModel = hiltViewModel(),
    onNavigateToEarnings: () -> Unit = {}
) {
    val isHost by userViewModel.isHostFlow.collectAsState(initial = false)
    var showWithdrawSheet by remember { mutableStateOf(false) }

    Scaffold(containerColor = Color.Transparent) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            ConnectoBackground(Modifier.fillMaxSize())
            if (isHost) {
                HostWalletContent(hostViewModel) { showWithdrawSheet = true }
            } else {
                UserWalletContent(userViewModel, onNavigateToEarnings = onNavigateToEarnings)
            }
        }

        if (showWithdrawSheet) {
            WithdrawalBottomSheet(hostViewModel) {
                showWithdrawSheet = false
                hostViewModel.clearMessages()
            }
        }
    }
}

@Composable
fun UserWalletContent(
    viewModel: WalletViewModel,
    onNavigateToEarnings: () -> Unit
) {
    val uiState by viewModel.state.collectAsState()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    var selectedPackageId by remember { mutableStateOf<String?>(null) }
    var previousBalance by remember { mutableStateOf(uiState.balance) }
    var showSuccessDialog by remember { mutableStateOf(false) }
    var successCoins by remember { mutableStateOf(0) }
    var showPaymentSheet by remember { mutableStateOf<CoinPackage?>(null) }

    val selectedPackage = uiState.coinPackages.firstOrNull { it.id == selectedPackageId }
        ?: uiState.coinPackages.firstOrNull()

    LaunchedEffect(uiState.coinPackages) {
        if (selectedPackageId == null && uiState.coinPackages.isNotEmpty()) {
            selectedPackageId = uiState.coinPackages.first().id
        }
    }

    LaunchedEffect(uiState.balance, uiState.isProcessingPayment) {
        if (!uiState.isProcessingPayment && uiState.balance > previousBalance) {
            successCoins = uiState.balance - previousBalance
            showSuccessDialog = true
        }
        previousBalance = uiState.balance
    }

    LaunchedEffect(uiState.error) {
        val message = uiState.error ?: return@LaunchedEffect
        val result = snackbarHostState.showSnackbar(
            message = message,
            actionLabel = "Dismiss",
            duration = SnackbarDuration.Short
        )
        if (result == SnackbarResult.ActionPerformed || result == SnackbarResult.Dismissed) {
            viewModel.clearError()
        }
    }

    if (showSuccessDialog) {
        PaymentSuccessDialog(
            coinsAdded = successCoins,
            newBalance = uiState.balance,
            onDismiss = { showSuccessDialog = false }
        )
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(top = 26.dp, bottom = 150.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            WalletTopBar(onTransactionsClick = onNavigateToEarnings)
            WalletBalanceSummary(balance = uiState.balance)
            CouponCard()
            WalletSectionTitle("Add Balance to Wallet")

            if (uiState.coinPackages.isEmpty()) {
                PackageSkeletonGrid()
            } else {
                RechargePackageGrid(
                    packages = uiState.coinPackages,
                    selectedId = selectedPackage?.id,
                    onSelect = { selectedPackageId = it }
                )
            }
        }

        selectedPackage?.let { pkg ->
            AddBalanceBar(
                pkg = pkg,
                isProcessing = uiState.isProcessingPayment,
                onClick = { showPaymentSheet = pkg },
                modifier = Modifier.align(Alignment.BottomCenter)
            )
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp)
        )

        showPaymentSheet?.let { pkg ->
            SelectPaymentMethodScreen(
                pkg = pkg,
                isProcessing = uiState.isProcessingPayment,
                onBackClick = { showPaymentSheet = null },
                onPayClick = {
                    viewModel.initiateRecharge(context, pkg.id)
                    showPaymentSheet = null
                }
            )
        }

        if (uiState.isProcessingPayment && showPaymentSheet == null) {
            PaymentLoadingOverlay()
        }
    }
}

@Composable
private fun WalletTopBar(onTransactionsClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            Icons.Default.ArrowBack,
            contentDescription = null,
            tint = Color.Black,
            modifier = Modifier.size(34.dp)
        )
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            "Wallet",
            color = Color.Black,
            fontWeight = FontWeight.ExtraBold,
            fontSize = 18.sp,
            modifier = Modifier.weight(1f)
        )
        Surface(
            shape = RoundedCornerShape(50),
            color = Color.Transparent,
            border = androidx.compose.foundation.BorderStroke(1.5.dp, ConnectoBlue),
            modifier = Modifier.clickable { onTransactionsClick() }
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.SwapVert, contentDescription = null, tint = ConnectoBlue, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Transactions", color = ConnectoBlue, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun WalletBalanceSummary(balance: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = ConnectoCardShape,
        colors = CardDefaults.cardColors(containerColor = ConnectoCard),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("My Balance", color = Color(0xFF333333), fontSize = 13.sp)
            Text(
                "$Rupee${balance}.00",
                color = ConnectoBlue,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 18.sp
            )
        }
    }
}

@Composable
private fun CouponCard() {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        WalletSectionTitle("Available Coupons")
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = ConnectoCardShape,
            colors = CardDefaults.cardColors(containerColor = ConnectoCard),
            elevation = CardDefaults.cardElevation(0.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.LocalOffer, contentDescription = null, tint = ConnectoBlue, modifier = Modifier.size(24.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("IPL OFFER- 10% OFF", color = ConnectoBlue, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("on ${Rupee}300 & above packs", color = ConnectoMuted, fontSize = 11.sp)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("1/1", color = ConnectoText, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("•", color = ConnectoMuted, fontSize = 18.sp)
                }
            }
        }
    }
}

@Composable
private fun WalletSectionTitle(title: String) {
    Text(
        title,
        color = Color.Black,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 15.sp
    )
}

@Composable
private fun RechargePackageGrid(
    packages: List<CoinPackage>,
    selectedId: String?,
    onSelect: (String) -> Unit
) {
    val rows = (packages.size + 1) / 2
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        modifier = Modifier
            .fillMaxWidth()
            .height((rows * 100).dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        userScrollEnabled = false
    ) {
        items(packages) { pkg ->
            RechargePackageCard(
                pkg = pkg,
                selected = pkg.id == selectedId,
                onClick = { onSelect(pkg.id) }
            )
        }
    }
}

@Composable
private fun RechargePackageCard(
    pkg: CoinPackage,
    selected: Boolean,
    onClick: () -> Unit
) {
    val extraPercent = if (pkg.coins > 0) ((pkg.bonus * 100f) / pkg.coins).toInt() else 0
    val badge = when {
        pkg.priceInr in 120..180 -> "Value Pack"
        pkg.priceInr in 250..350 -> "Popular"
        else -> null
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(90.dp)
            .clickable(onClick = onClick)
            .then(
                if (selected) Modifier.border(2.dp, ConnectoBlue, RoundedCornerShape(14.dp))
                else Modifier
            ),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = ConnectoCard),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 12.dp, vertical = 10.dp)
        ) {
            Column(
                modifier = Modifier.align(Alignment.CenterStart),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                if (pkg.displayName.isNotEmpty()) {
                    Text(
                        pkg.displayName,
                        color = ConnectoMuted,
                        fontWeight = FontWeight.Medium,
                        fontSize = 10.sp
                    )
                }
                Text(
                    "${pkg.coins} Coins",
                    color = ConnectoText,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
                if (extraPercent > 0) {
                    Text(
                        "+$extraPercent% Extra",
                        color = ConnectoGreen,
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.sp
                    )
                }
            }
            
            Column(
                modifier = Modifier.align(Alignment.CenterEnd),
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    "$Rupee${pkg.priceInr}",
                    color = ConnectoBlue,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 15.sp
                )
                badge?.let {
                    Surface(
                        shape = RoundedCornerShape(50), 
                        color = ConnectoRed
                    ) {
                        Text(
                            it,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 9.sp,
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AddBalanceBar(
    pkg: CoinPackage,
    isProcessing: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val extra = pkg.bonus.takeIf { it > 0 } ?: ((pkg.priceInr * 0.2f).toInt())
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = Color.White,
        shadowElevation = 8.dp,
        shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                "Get $Rupee$extra Extra cashback on this pack",
                color = ConnectoGreen,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Button(
                onClick = onClick,
                enabled = !isProcessing,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp),
                shape = RoundedCornerShape(50),
                colors = ButtonDefaults.buttonColors(
                    containerColor = ConnectoBlue,
                    disabledContainerColor = Color(0xFFB8B8B8)
                )
            ) {
                if (isProcessing) {
                    CircularProgressIndicator(
                        color = Color.White,
                        strokeWidth = 2.dp,
                        modifier = Modifier.size(22.dp)
                    )
                } else {
                    Text("Add Balance", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun PackageSkeletonGrid() {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        modifier = Modifier
            .fillMaxWidth()
            .height(464.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        userScrollEnabled = false
    ) {
        items(8) {
            ShimmerPackageCard()
        }
    }
}

@Composable
fun ShimmerPackageCard() {
    val isDark = androidx.compose.foundation.isSystemInDarkTheme()
    val shimmerColor = if (isDark) DarkCard else LightCard
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = shimmerColor)
    ) {}
}

@Composable
fun PaymentLoadingOverlay() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.42f)),
        contentAlignment = Alignment.Center
    ) {
        Card(
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(12.dp)
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 34.dp, vertical = 30.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CircularProgressIndicator(color = ConnectoBlue, strokeWidth = 4.dp, modifier = Modifier.size(44.dp))
                Spacer(modifier = Modifier.height(18.dp))
                Text("Processing payment", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = ConnectoText)
                Spacer(modifier = Modifier.height(6.dp))
                Text("Waiting for Cashfree confirmation", color = ConnectoMuted, fontSize = 14.sp)
            }
        }
    }
}

@Composable
fun PaymentSuccessDialog(
    coinsAdded: Int,
    newBalance: Int,
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(dismissOnBackPress = true, dismissOnClickOutside = true)
    ) {
        Card(
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = ConnectoGreen, modifier = Modifier.size(48.dp))
                Spacer(modifier = Modifier.height(10.dp))
                Text("Payment successful", color = ConnectoText, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                Spacer(modifier = Modifier.height(6.dp))
                Text("+$coinsAdded coins added", color = ConnectoMuted, fontSize = 13.sp)
                Text("New balance: $newBalance coins", color = ConnectoBlue, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onDismiss,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp),
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = ConnectoBlue)
                ) {
                    Text("Done", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }
        }
    }
}

@Composable
fun HostWalletContent(viewModel: HostWalletViewModel, onWithdrawClick: () -> Unit) {
    val uiState by viewModel.uiState

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .padding(top = 26.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.Black, modifier = Modifier.size(26.dp))
            Spacer(modifier = Modifier.width(10.dp))
            Text("Earnings", color = Color.Black, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp)
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = ConnectoCardShape,
            colors = CardDefaults.cardColors(containerColor = ConnectoCard),
            elevation = CardDefaults.cardElevation(0.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Total Earnings", color = ConnectoMuted, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    "INR ${uiState.earnings?.totalEarningsInr ?: 0.0}",
                    color = ConnectoBlue,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold
                )
                Spacer(modifier = Modifier.height(14.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    EarningStat("Minutes", "${uiState.earnings?.totalCallMinutes ?: 0}", Icons.Default.Call)
                    EarningStat("Available", "INR ${uiState.earnings?.availableForWithdrawal ?: 0.0}", Icons.Default.KeyboardArrowRight)
                }
            }
        }

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = ConnectoCardShape,
            color = Color.White
        ) {
            Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Refresh, contentDescription = null, tint = ConnectoBlue, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(10.dp))
                Text("Next payout cycle: ${uiState.nextPayoutDate}", color = ConnectoText, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        Button(
            onClick = onWithdrawClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(50),
            colors = ButtonDefaults.buttonColors(containerColor = ConnectoBlue)
        ) {
            Icon(Icons.Default.CreditCard, contentDescription = null, tint = Color.White)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Withdraw to UPI", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Shield, contentDescription = null, tint = ConnectoGreen, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("Earnings history", color = ConnectoText, fontSize = 17.sp, fontWeight = FontWeight.Bold)
        }

        Text("No recent transactions", color = ConnectoMuted, fontSize = 16.sp)
    }
}

@Composable
fun EarningStat(label: String, value: String, icon: ImageVector) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = ConnectoBlue, modifier = Modifier.size(18.dp))
        Spacer(modifier = Modifier.width(8.dp))
        Column {
            Text(label, color = ConnectoMuted, fontSize = 12.sp)
            Text(value, color = ConnectoText, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun SelectPaymentMethodScreen(
    pkg: CoinPackage,
    isProcessing: Boolean,
    onBackClick: () -> Unit,
    onPayClick: () -> Unit
) {
    val rechargeAmount = pkg.priceInr
    val taxes = rechargeAmount * 0.27993
    val payableAmount = rechargeAmount + taxes
    val formattedTaxes = String.format(java.util.Locale.US, "%.2f", taxes)
    val formattedPayable = String.format(java.util.Locale.US, "%.1f", payableAmount)
    val totalCoins = pkg.coins + pkg.bonus

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(ConnectoBgTop, ConnectoBgBottom)))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(top = 26.dp, bottom = 100.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBackClick) {
                    Icon(
                        Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = Color.Black,
                        modifier = Modifier.size(28.dp)
                    )
                }
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    "Select Payment Method",
                    color = Color.Black,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 20.sp
                )
            }

            // Summary Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = ConnectoCardShape,
                colors = CardDefaults.cardColors(containerColor = ConnectoCard),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Recharge Amount", color = Color(0xFF555555), fontSize = 14.sp)
                        Text("$Rupee$rechargeAmount", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                "Taxes and other charges",
                                color = Color(0xFF555555),
                                fontSize = 14.sp,
                                modifier = Modifier.drawBehind {
                                    val strokeWidth = 1.dp.toPx()
                                    val y = size.height + strokeWidth
                                    drawLine(
                                        color = Color(0xFF888888),
                                        start = Offset(0f, y),
                                        end = Offset(size.width, y),
                                        strokeWidth = strokeWidth,
                                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(5f, 5f), 0f)
                                    )
                                }
                            )
                        }
                        Text("$Rupee$formattedTaxes", color = Color.Black, fontSize = 14.sp)
                    }

                    Spacer(modifier = Modifier.height(2.dp))
                    androidx.compose.material3.Divider(color = Color(0xFFE5E5E5), thickness = 1.dp)
                    Spacer(modifier = Modifier.height(2.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Payable Amount", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text(
                            "$Rupee$formattedPayable",
                            color = ConnectoBlue,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp
                        )
                    }
                }
            }

            // Coupon Row
            Card(
                modifier = Modifier.fillMaxWidth().clickable { },
                shape = ConnectoCardShape,
                colors = CardDefaults.cardColors(containerColor = ConnectoCard),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.LocalOffer,
                        contentDescription = null,
                        tint = ConnectoBlue,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        "View All Coupons",
                        color = Color.Black,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        modifier = Modifier.weight(1f)
                    )
                    Icon(
                        Icons.Default.KeyboardArrowRight,
                        contentDescription = null,
                        tint = Color.Gray,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            // Green Benefit Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = ConnectoCardShape,
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF1FDF3)),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFF27C044)),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = Color(0xFF27C044),
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        "You will get $Rupee$totalCoins in this recharge",
                        color = Color(0xFF27C044),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }

            // UPI Section
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = ConnectoCardShape,
                colors = CardDefaults.cardColors(containerColor = ConnectoCard),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "UPI",
                                color = Color.Black,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 18.sp,
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.ExtraBold
                                )
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                "Pay by any UPI app",
                                color = Color(0xFF444444),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.SwapVert,
                                contentDescription = null,
                                tint = ConnectoBlue,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(
                                "Fastest",
                                color = ConnectoBlue,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                    }

                    Text(
                        "Preferred by 95% Users",
                        color = Color(0xFF27C044),
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )

                    // Apps Horizontal Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        UpiAppItem(
                            appName = "Google Pay",
                            logoColor = Color(0xFFEA4335),
                            iconRepresentation = {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .background(Color(0xFFF1F3F4), CircleShape)
                                        .border(1.5.dp, ConnectoBlue, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("G", color = ConnectoBlue, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                }
                            }
                        )
                        
                        UpiAppItem(
                            appName = "BHIM",
                            logoColor = Color(0xFFEA4335),
                            iconRepresentation = {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .background(Color(0xFFEAEAEA), RoundedCornerShape(6.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("BHIM", color = Color(0xFFE15A24), fontWeight = FontWeight.ExtraBold, fontSize = 10.sp)
                                }
                            }
                        )

                        UpiAppItem(
                            appName = "Amazon P...",
                            logoColor = Color(0xFFEA4335),
                            iconRepresentation = {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .background(Color(0xFFFFF9E6), RoundedCornerShape(6.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("pay", color = Color(0xFF232F3E), fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                }
                            }
                        )
                    }
                }
            }

            // QR Row Card
            Card(
                modifier = Modifier.fillMaxWidth().clickable { },
                shape = ConnectoCardShape,
                colors = CardDefaults.cardColors(containerColor = ConnectoCard),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.ReceiptLong,
                        contentDescription = null,
                        tint = ConnectoBlue,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        "QR to Scan & Pay",
                        color = Color.Black,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        modifier = Modifier.weight(1f)
                    )
                    Icon(
                        Icons.Default.KeyboardArrowRight,
                        contentDescription = null,
                        tint = Color.Gray,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            // Card Payment Row
            Card(
                modifier = Modifier.fillMaxWidth().clickable { },
                shape = ConnectoCardShape,
                colors = CardDefaults.cardColors(containerColor = ConnectoCard),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.CreditCard,
                        contentDescription = null,
                        tint = ConnectoBlue,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        "Pay using Credit/Debit Card",
                        color = Color.Black,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        modifier = Modifier.weight(1f)
                    )
                    Icon(
                        Icons.Default.KeyboardArrowRight,
                        contentDescription = null,
                        tint = Color.Gray,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        }

        // Sticky Bottom Pay button
        Surface(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth(),
            color = Color.White,
            shadowElevation = 8.dp,
            shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Button(
                    onClick = onPayClick,
                    enabled = !isProcessing,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ConnectoBlue,
                        disabledContainerColor = Color(0xFFB8B8B8)
                    )
                ) {
                    if (isProcessing) {
                        CircularProgressIndicator(
                            color = Color.White,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(22.dp)
                        )
                    } else {
                        Text(
                            "Pay $Rupee$formattedPayable",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun UpiAppItem(
    appName: String,
    logoColor: Color,
    iconRepresentation: @Composable () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
        modifier = Modifier.clickable { }
    ) {
        iconRepresentation()
        Text(
            appName,
            color = Color.Black,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

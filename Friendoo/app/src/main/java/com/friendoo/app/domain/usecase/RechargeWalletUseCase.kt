package com.friendoo.app.domain.usecase

import com.friendoo.app.data.repository.WalletRepository
import javax.inject.Inject

class RechargeWalletUseCase @Inject constructor(
    private val walletRepository: WalletRepository
) {
    suspend operator fun invoke(userId: String, amount: Int, paymentId: String): Result<Boolean> {
        return walletRepository.rechargeWallet(userId, amount, paymentId)
    }
}

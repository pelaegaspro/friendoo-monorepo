package com.friendoo.app.domain.usecase

import com.friendoo.app.data.model.Host
import com.friendoo.app.data.repository.HostRepository
import javax.inject.Inject

class GetDiscoverHostsUseCase @Inject constructor(
    private val hostRepository: HostRepository
) {
    suspend operator fun invoke(): Result<List<Host>> {
        return hostRepository.getHosts()
    }

    suspend fun byLanguage(languageCode: String): Result<List<Host>> {
        return hostRepository.getHostsByLanguage(languageCode)
    }

    suspend fun allLanguages(): Result<Map<String, List<Host>>> {
        val languages = listOf("ta", "hi", "ml", "te")
        val map = linkedMapOf<String, List<Host>>()
        for (code in languages) {
            val hosts = hostRepository.getHostsByLanguage(code).getOrDefault(emptyList())
            if (hosts.isNotEmpty()) map[code] = hosts
        }
        return Result.success(map)
    }
}

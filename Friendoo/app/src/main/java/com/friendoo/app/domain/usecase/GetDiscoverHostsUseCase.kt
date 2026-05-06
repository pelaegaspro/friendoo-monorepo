package com.friendoo.app.domain.usecase

import com.friendoo.app.data.model.Host
import com.friendoo.app.data.repository.HostRepository
import javax.inject.Inject

class GetDiscoverHostsUseCase @Inject constructor(
    private val repository: HostRepository
) {
    suspend operator fun invoke(): Result<List<Host>> {
        return repository.getHosts()
    }
}

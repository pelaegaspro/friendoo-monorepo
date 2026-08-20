package com.friendoo.app.data.remote.api

import com.friendoo.app.data.remote.api.dto.CallLogDto
import com.friendoo.app.data.remote.api.dto.DashboardDto
import com.friendoo.app.data.remote.api.dto.UserDto
import retrofit2.Response
import retrofit2.http.GET

interface AdminApiService {
    @GET("api/admin/users")
    suspend fun getUsers(): Response<List<UserDto>>

    @GET("api/admin/calls")
    suspend fun getCalls(): Response<List<CallLogDto>>

    @GET("api/admin/dashboard")
    suspend fun getDashboard(): Response<DashboardDto>
}

import { apiRequest } from "./client";

/**
 * 백엔드 API 응답 타입 (snake_case)
 */
interface BackendUserMe {
  name: string;
  email: string;
  is_email_confirmed: boolean;
  is_profile_completed: boolean;
}

/**
 * 사용자 정보 타입 (camelCase)
 */
export interface UserMe {
  name: string;
  email: string;
  isEmailConfirmed: boolean;
  isProfileCompleted: boolean;
}

/**
 * 사용자 정보 수정 파라미터
 */
export interface UpdateUserParams {
  name?: string;
}

/**
 * 비밀번호 변경 파라미터
 */
export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

/**
 * User API
 * 사용자 정보 조회, 수정, 비밀번호 변경, 계정 삭제 등의 기능 제공
 */
export const userApi = {
  /**
   * 현재 로그인한 사용자 정보 조회
   * @returns UserMe 사용자 정보
   */
  getMe: async (): Promise<UserMe> => {
    const data = await apiRequest<BackendUserMe>("/api/v1/users/me/", { auth: true });
    return {
      name: data.name,
      email: data.email,
      isEmailConfirmed: data.is_email_confirmed,
      isProfileCompleted: data.is_profile_completed,
    };
  },

  /**
   * 사용자 정보 수정
   * @param params 수정할 사용자 정보
   * @returns 수정된 사용자 정보
   */
  updateMe: async (params: UpdateUserParams): Promise<UserMe> => {
    const data = await apiRequest<BackendUserMe>("/api/v1/users/me/", {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(params),
    });
    return {
      name: data.name,
      email: data.email,
      isEmailConfirmed: data.is_email_confirmed,
      isProfileCompleted: data.is_profile_completed,
    };
  },

  /**
   * 비밀번호 변경
   * @param params 현재 비밀번호와 새 비밀번호
   * @returns 성공 메시지
   */
  changePassword: (params: ChangePasswordParams) =>
    apiRequest<{ message: string }>("/api/v1/users/change-password/", {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        current_password: params.currentPassword,
        new_password: params.newPassword,
      }),
    }),

  /**
   * 계정 삭제 (회원 탈퇴)
   * @returns void
   */
  deleteAccount: () =>
    apiRequest<void>("/api/v1/users/", {
      method: "DELETE",
      auth: true,
    }),
};

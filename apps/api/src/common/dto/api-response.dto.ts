export class ApiResponse<T = any> {
  success!: boolean;
  data?: T;
  error?: {
    code!: string;
    message!: string;
  };

  private constructor(partial: Partial<ApiResponse<T>>) {
    Object.assign(this, partial);
  }

  static success<T>(data: T): ApiResponse<T> {
    return new ApiResponse<T>({
      success: true,
      data,
    });
  }

  static error(code: string, message: string): ApiResponse<never> {
    return new ApiResponse<never>({
      success: false,
      error: { code, message },
    });
  }
}

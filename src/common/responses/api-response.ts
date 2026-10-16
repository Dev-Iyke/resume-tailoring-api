export type ApiSuccessResponse<TData> = {
  success: boolean;
  message: string;
  data: TData;
};

export function successResponse<TData>(
  message: string,
  data: TData,
): ApiSuccessResponse<TData> {
  return {
    success: true,
    message,
    data,
  };
}

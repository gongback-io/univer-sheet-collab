# import os
#
# def to_pascal_case_and_operation(original_id: str) -> str:
#     """
#     예: 'sheet.mutation.set-gridlines-color'
#     -> 'SheetMutationSetGridlinesColorOperation'
#     """
#     parts = original_id.split('.')  # ['sheet', 'mutation', 'set-gridlines-color']
#     pascal_parts = []
#     for part in parts:
#         sub_parts = part.split('-')  # ['set', 'gridlines', 'color']
#         # 각 sub_part의 첫 글자를 대문자로 만들어 이어 붙임
#         sub_parts = [x.capitalize() for x in sub_parts]
#         pascal_parts.append("".join(sub_parts))  # 'SetGridlinesColor'
#     joined = "".join(pascal_parts)  # 'SheetMutationSetGridlinesColor'
#     return joined + "Operation"     # 뒤에 Operation 붙이기
#
# def generate_ts_file(class_name: str, original_id: str) -> str:
#     """
#     .ts 파일에 들어갈 템플릿(문자열)을 반환
#     """
#     return f"""import {{ BaseOperationModel }} from "@src/transformer/operation/BaseOperationModel";
# import {{ ITransformable }} from "@src/transformer/types";
# import {{IOperation}} from "@src/types";
#
# export default class {class_name} extends BaseOperationModel {{
#     public static override id = '{original_id}';
# }}
# """
#
# def main():
#     # 현재 파이썬 파일이 위치한 디렉토리
#     base_dir = os.path.dirname(os.path.realpath(__file__))
#
#     # os.walk로 모든 하위 디렉토리를 순회
#     for root, dirs, files in os.walk(base_dir):
#         # files 목록에 command.txt가 있으면 처리
#         if "command.txt" in files:
#             command_txt_path = os.path.join(root, "command.txt")
#
#             # command.txt 한 줄씩 읽기
#             with open(command_txt_path, "r", encoding="utf-8") as f:
#                 lines = [line.strip() for line in f if line.strip()]
#
#             for original_id in lines:
#                 class_name = to_pascal_case_and_operation(original_id)
#                 ts_filename = class_name + ".ts"
#                 ts_filepath = os.path.join(root, ts_filename)
#
#                 # 이미 같은 이름의 ts파일이 있으면 건너뛰기
#                 if os.path.exists(ts_filepath):
#                     print(f"[SKIP] 이미 존재함: {ts_filepath}")
#                     continue
#
#                 # 생성할 ts 파일 내용
#                 ts_content = generate_ts_file(class_name, original_id)
#                 with open(ts_filepath, "w", encoding="utf-8") as out_file:
#                     out_file.write(ts_content)
#                 print(f"[CREATE] {ts_filepath}")
#
# if __name__ == "__main__":
#     main()

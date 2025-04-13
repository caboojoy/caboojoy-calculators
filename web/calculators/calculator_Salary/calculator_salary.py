import pandas as pd
import math

def clean_range(value):
    """
    문자열로 된 '이상' 및 '미만' 데이터를 정리하여 숫자로 변환합니다.
    """
    value = value.split("\n")[0]  # 줄바꿈 제거
    value = value.replace("초과", "").replace("이하", "").strip()  # '초과', '이하' 제거
    return int(value)

def load_tax_table(file_path):
    """
    엑셀 파일에서 간이세액표를 불러옵니다.
    """
    tax_table = pd.read_excel(
        file_path,
        skiprows=5,  # 첫 5행 건너뜀 (헤더 제외)
        usecols="A:M",  # A열부터 M열까지 사용
        names=["이상", "미만"] + list(range(1, 12)),  # 열 이름 지정
        dtype=str  # 모든 데이터를 문자열로 읽기
    )
    
    # "이상"과 "미만" 열의 문자열 데이터를 숫자로 변환
    tax_table["이상"] = tax_table["이상"].apply(clean_range)
    tax_table["미만"] = tax_table["미만"].apply(clean_range)
    
    return tax_table

def calculate_tax(monthly_salary, dependents, children, tax_table):
    """
    월급여와 공제대상 가족 수에 따른 근로소득세를 계산합니다.
    """
    # 월급여를 천원 단위로 변환
    monthly_salary_thousands = math.floor(monthly_salary / 1000)
    
    # 급여 구간 찾기
    row = tax_table[(tax_table["이상"] <= monthly_salary_thousands) & 
                    (tax_table["미만"] > monthly_salary_thousands)]
    
    if row.empty:
        print("월급여가 간이세액표 범위를 초과했습니다.")
        return 0
    
    # 공제대상 가족 수에 따른 세액 가져오기
    tax = row.iloc[0, dependents]
    
    # 자녀 세액공제 적용
    if children >= 1:
        tax -= 12500
    if children >= 2:
        tax -= 16660
    if children >= 3:
        tax -= (children - 2) * 25000
    
    return max(tax, 0)

def apply_limits(value, lower_limit, upper_limit):
    """
    값에 상한선과 하한선을 적용합니다.
    """
    return min(max(value, lower_limit), upper_limit)

def calculate_salary():
    """
    급여 계산 프로그램의 메인 함수입니다.
    """
    # 엑셀 파일에서 간이세액표 불러오기
    file_path = '근로소득_간이세액표(조견표).xlsx'  # 파일 경로 설정
    tax_table = load_tax_table(file_path)

    while True:
        print("\n급여 유형을 선택하세요:")
        print("1. 연봉")
        print("2. 월급여")
        salary_type = input("선택 (1 또는 2): ")

        if salary_type not in ['1', '2']:
            print("잘못된 선택입니다. 1 또는 2를 입력해주세요.")
            continue

        amount = float(input("금액을 입력하세요: "))

        if salary_type == "1":
            monthly_salary = math.floor(amount / 12)
            print(f"월 환산 급여: {monthly_salary:,.0f}원")
        else:
            monthly_salary = amount

        meal_allowance = float(input("식대를 입력하세요: "))
        car_allowance = float(input("자가운전보조금을 입력하세요: "))
        dependents = int(input("부양가족 수를 입력하세요 (본인 포함): "))
        children = int(input("8세 이상 20세 이하 자녀 수를 입력하세요: "))

        non_taxable = min(meal_allowance, 200000) + min(car_allowance, 200000)
        taxable_meal = max(0, meal_allowance - 200000)
        taxable_car = max(0, car_allowance - 200000)
        base_salary = monthly_salary - non_taxable + taxable_meal + taxable_car

        pension_rate = 0.045
        health_rate = 0.03545
        longterm_care_rate = 0.004591
        employment_rate = 0.009

        # 국민연금 계산 (상한선 및 하한선 적용)
        pension_base = apply_limits(base_salary, lower_limit=390000, upper_limit=6170000)
        pension_cap = apply_limits(pension_base * pension_rate, lower_limit=17550, upper_limit=277650)

        # 건강보험 계산 (상한선 및 하한선 적용)
        health_base = apply_limits(base_salary, lower_limit=279266, upper_limit=127056982)
        health_cap = apply_limits(health_base * health_rate, lower_limit=19780, upper_limit=8481420)

        # 장기요양보험 계산 (건강보험료 기준)
        longterm_care_cap = health_cap * longterm_care_rate

        # 고용보험 계산 (상한선 없음)
        employment_cap = base_salary * employment_rate

        income_tax = calculate_tax(base_salary, dependents, children, tax_table)
        local_tax = math.floor(income_tax * 0.1)

        print("\n===== 급여 명세서 =====")
        print("----- 급여 항목 -----")
        print(f"기본급: {base_salary:,.0f}원")
        print(f"식대 (비과세): {min(meal_allowance, 200000):,.0f}원")
        print(f"자가운전보조금 (비과세): {min(car_allowance, 200000):,.0f}원")
        
        total_salary = monthly_salary
        print(f"\n급여 항목 합계: {total_salary:,.0f}원")
        
        print("\n----- 공제 항목 -----")
        print(f"국민연금: {pension_cap:,.0f}원 (요율: {pension_rate*100:.3f}%, 상한액: 월277,650원, 하한액: 월17,550원)")
        print(f"건강보험: {health_cap:,.0f}원 (요율: {health_rate*100:.3f}%, 상한액: 월8,481,420원, 하한액: 월19,780원)")
        print(f"장기요양보험: {longterm_care_cap:,.0f}원 (요율: {longterm_care_rate*100:.3f}%)")
        print(f"고용보험: {employment_cap:,.0f}원 (요율: {employment_rate*100:.3f}%)")
        print(f"근로소득세: {income_tax:,.0f}원")
        print(f"지방소득세: {local_tax:,.0f}원")
        
        total_deduction = pension_cap + health_cap + longterm_care_cap + employment_cap + income_tax + local_tax
        print(f"\n공제 항목 합계: {total_deduction:,.0f}원")
        
        net_salary = total_salary - total_deduction
        print(f"\n차감급여 (실수령액): {net_salary:,.0f}원")

calculate_salary()

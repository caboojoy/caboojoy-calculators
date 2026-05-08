def calculate_simple_interest(principal, rate, time):
    """단리 이자 계산"""
    interest = principal * rate * time
    return interest

def calculate_compound_interest(principal, rate, time, n):
    """복리 이자 계산"""
    amount = principal * (1 + (rate / n)) ** (n * time)
    interest = amount - principal
    return interest

def calculate_savings_interest(monthly_deposit, rate, time):
    """적금 이자 계산 (매월 복리)"""
    total_deposit = monthly_deposit * 12 * time
    future_value = 0
    for i in range(int(time * 12)):
        future_value += monthly_deposit * (1 + (rate / 12)) ** (time * 12 - i)
    interest = future_value - total_deposit
    return interest

def calculate_loan_interest(principal, rate, time, payment_frequency="monthly"):
    """대출 이자 계산 (원리금 균등 상환 방식)"""
    if payment_frequency == "monthly":
        n = 12
    elif payment_frequency == "quarterly":
        n = 4
    elif payment_frequency == "yearly":
        n = 1
    else:
        return "잘못된 납부 빈도입니다."

    monthly_rate = rate / n
    num_payments = time * n
    monthly_payment = (principal * monthly_rate) / (1 - (1 + monthly_rate)**(-num_payments))
    total_payment = monthly_payment * num_payments
    total_interest = total_payment - principal
    return total_interest, monthly_payment


# 사용자 인터페이스 (CLI 기반)
while True:
    print("\n이자 계산기")
    print("1. 단리 계산")
    print("2. 복리 계산")
    print("3. 적금 이자 계산")
    print("4. 대출 이자 계산")
    print("5. 종료")

    choice = input("원하는 계산 방식을 선택하세요 (1-5): ")

    if choice == '1':
        principal = float(input("원금을 입력하세요: "))
        rate = float(input("연 이율을 입력하세요 (예: 0.05): "))
        time = float(input("기간을 입력하세요 (년): "))
        interest = calculate_simple_interest(principal, rate, time)
        print("단리 이자:", interest)

    elif choice == '2':
        principal = float(input("원금을 입력하세요: "))
        rate = float(input("연 이율을 입력하세요 (예: 0.05): "))
        time = float(input("기간을 입력하세요 (년): "))
        n = int(input("연간 복리 횟수를 입력하세요 (예: 12): "))
        interest = calculate_compound_interest(principal, rate, time, n)
        print("복리 이자:", interest)

    elif choice == '3':
        monthly_deposit = float(input("월 납입액을 입력하세요: "))
        rate = float(input("연 이율을 입력하세요 (예: 0.03): "))
        time = float(input("기간을 입력하세요 (년): "))
        interest = calculate_savings_interest(monthly_deposit, rate, time)
        print("적금 이자:", interest)

    elif choice == '4':
        principal = float(input("대출 원금을 입력하세요: "))
        rate = float(input("연 이율을 입력하세요 (예: 0.05): "))
        time = float(input("대출 기간을 입력하세요 (년): "))
        payment_frequency = input("납부 빈도를 선택하세요 (monthly, quarterly, yearly): ")
        interest, monthly_payment = calculate_loan_interest(principal, rate, time, payment_frequency)
        print("총 이자:", interest)
        print("월 납부액:", monthly_payment)

    elif choice == '5':
        print("계산기를 종료합니다.")
        break

    else:
        print("잘못된 선택입니다. 1-5 사이의 숫자를 입력하세요.")

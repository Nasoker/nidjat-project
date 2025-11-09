from django.shortcuts import render


def capitalization(request):
    return render(request, 'capitalization.html')


def client(request):
    return render(request, 'client.html')


def clients(request):
    return render(request, 'clients.html')


def login(request):
    return render(request, 'login.html')


def orders(request):
    return render(request, 'orders.html')

def purchase(request):
    return render(request, 'purchase.html')

def report(request):
    return render(request, 'report.html')


def salary(request):
    return render(request, 'salary.html')


def budget(request):
    return render(request, 'budget.html')

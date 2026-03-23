from inspect import signature as _mutmut_signature
from typing import Annotated
from typing import Callable
from typing import ClassVar


MutantDict = Annotated[dict[str, Callable], "Mutant"]


def _mutmut_trampoline(orig, mutants, call_args, call_kwargs, self_arg = None):
    """Forward call to original or mutated function, depending on the environment"""
    import os
    mutant_under_test = os.environ['MUTANT_UNDER_TEST']
    if mutant_under_test == 'fail':
        from mutmut.__main__ import MutmutProgrammaticFailException
        raise MutmutProgrammaticFailException('Failed programmatically')      
    elif mutant_under_test == 'stats':
        from mutmut.__main__ import record_trampoline_hit
        record_trampoline_hit(orig.__module__ + '.' + orig.__name__)
        result = orig(*call_args, **call_kwargs)
        return result
    prefix = orig.__module__ + '.' + orig.__name__ + '__mutmut_'
    if not mutant_under_test.startswith(prefix):
        result = orig(*call_args, **call_kwargs)
        return result
    mutant_name = mutant_under_test.rpartition('.')[-1]
    if self_arg is not None:
        # call to a class method where self is not bound
        result = mutants[mutant_name](self_arg, *call_args, **call_kwargs)
    else:
        result = mutants[mutant_name](*call_args, **call_kwargs)
    return result
def x_add__mutmut_orig(a, b):
    return a + b
def x_add__mutmut_1(a, b):
    return a - b

x_add__mutmut_mutants : ClassVar[MutantDict] = {
'x_add__mutmut_1': x_add__mutmut_1
}

def add(*args, **kwargs):
    result = _mutmut_trampoline(x_add__mutmut_orig, x_add__mutmut_mutants, args, kwargs)
    return result 

add.__signature__ = _mutmut_signature(x_add__mutmut_orig)
x_add__mutmut_orig.__name__ = 'x_add'

def x_subtract__mutmut_orig(a, b):
    return a - b

def x_subtract__mutmut_1(a, b):
    return a + b

x_subtract__mutmut_mutants : ClassVar[MutantDict] = {
'x_subtract__mutmut_1': x_subtract__mutmut_1
}

def subtract(*args, **kwargs):
    result = _mutmut_trampoline(x_subtract__mutmut_orig, x_subtract__mutmut_mutants, args, kwargs)
    return result 

subtract.__signature__ = _mutmut_signature(x_subtract__mutmut_orig)
x_subtract__mutmut_orig.__name__ = 'x_subtract'

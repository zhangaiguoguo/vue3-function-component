export function updateNumberRounding(...args) {
    if (!isNaN(+args[3].v)) {
        const cellItem = { v: args[3] };
        if (cellItem?.v?.amendmentRules?.length) {
            const amendmentRules = cellItem?.v?.amendmentRules;
            const rules = cellItem.v?.amendmentRules.map((item, sub) => {
                const info = item._info;
                let flag = false;
                switch (info.roundingConditionSymbol) {
                    case ">":
                        flag = +args[3].v > +info.roundingConditionNum;
                        break;
                    case "≥":
                        flag = +args[3].v >= +info.roundingConditionNum;
                        break;
                    case "<":
                        flag = +args[3].v < +info.roundingConditionNum;
                        break;
                    case "≤":
                        flag = +args[3].v <= +info.roundingConditionNum;
                        break;
                }
                return flag ? sub : void 0;
            }).filter((item) => item !== void 0);
            if (rules?.length) {
                const info = amendmentRules[rules[0]]._info;

                function _run(info, cellItem) {
                    if (cellItem.v == null || cellItem.v === "" || +cellItem.v === 0) return cellItem.v;
                    switch (info.rulesForRounding) {
                        case "四舍五入":
                            if (info.retentionMethod === "保留小数位数") {
                                return $$$$hooks.b(cellItem.v, info.reservedDigits);
                            } else {
                                return $$$$hooks.a(cellItem.v, info.reservedDigits);
                            }
                        case "四舍六入五留双":
                            if (info.retentionMethod === "保留小数位数") {
                                return $$$$hooks.c(cellItem.v, info.reservedDigits);
                            } else {
                                return $$$$hooks.c2(cellItem.v, info.reservedDigits);
                            }
                        case "尾数进位":
                            if (info.retentionMethod === "保留小数位数") {
                                return $$$$hooks.ceil(cellItem.v, info.reservedDigits);
                            } else {
                                return $$$$hooks.ceil2(cellItem.v, info.reservedDigits);
                            }
                        case "尾数舍去":
                            if (info.retentionMethod === "保留小数位数") {
                                return $$$$hooks.floor(cellItem.v, info.reservedDigits);
                            } else {
                                return $$$$hooks.floor2(cellItem.v, info.reservedDigits);
                            }
                    }
                    return cellItem.v;
                }

                const result = { v: _run(info, cellItem.v) };
                result.mv = result.v;
                if (info.scientificNotation === +true) {
                    result.v = scientificNotationRun({ originValue: result }, []).m;
                }
                Object.assign(args[3], { v: result.mv, m: result.v });
            }
        }
    }
    return args[3];
}

export const _____keys = {
    check: ["n.a.", "N/A", "N.D.", "N.D", 0],
};
export const _____keysPerms = ["check"];

function scientificNotationRun(region, args) {
    function _run(...args) {
        //取到当前范围的原来的数值
        const cellValue = this.originValue;
        //取到当前范围的数值
        const value = cellValue.v;
        //转化为字符串
        const valueArs = toString(value).split("");

        //将字符串中的小数点去掉
        function _1(v) {
            return v.filter((item) => item !== ".");
        }

        //查找当前数值中第一个不为0的数值
        const sub = valueArs.findIndex((item) => new RegExp("[1-9]+").test(item));
        //截取当前不为0的数值之前的数值 （这里的操作是因为当前数值有可能为小数）
        const startStr = _1(valueArs.slice(0, sub));
        //截取当前不为0的数值之后的数值
        const endStr = _1(valueArs.slice(sub + 1));
        //将截取之后的数组转换为字符串
        let _endStr = (endStr.join(""));
        //判断是否要保留小数位数
        let splitIndex = this.reservedDigits !== null ? this.reservedDigits : _endStr.length;
        //取出保留小数的之后数值的长度
        const cf_ = valueArs.slice(sub + 1, valueArs.indexOf(".")).length;
        //取出当前转换之后的平方值 （之后+之前）
        const cf = (cf_ < -1 || cf_ === void 0 ? 1 : cf_) + (startStr.length);
        //特殊处理 如果保留位数不够 则补位数
        if (endStr.length < splitIndex) {
            while (!void 0) {
                if (endStr.length > splitIndex) break;
                endStr.push("0");
            }
            //转换为字符串
            _endStr = (endStr.join(""));
        }
        //特殊处理 如果保留位数不够 则补位数 （特殊中的特殊）
        if (endStr.length === splitIndex && !splitIndex) {
            endStr.push("0");
            splitIndex = 1;
            _endStr = (endStr.join(""));
        }
        //取到转换之后数值的小数为数值
        const _endStrSplitStr = _endStr.slice(0, splitIndex);
        // console.log(startStr, endStr, valueArs, splitIndex)
        //取到转换转换之后的新数值；
        const startNVAL = `${valueArs[sub]}${_endStrSplitStr ? ("." + _endStrSplitStr) : _endStrSplitStr}`;
        const endNVAL = `×10${(startStr.length ? "ˉ" : "") + scientificNotationSUPMap(cf < +true ? +true : cf)}`;
        //赋值
        const cellValue_ = {
            ...cellValue,
            m: startNVAL + endNVAL,
            snRules: [startNVAL, endNVAL],
        };
        //更新单元格
        return updatedNumericModifiersCell.apply(this, [cellValue_, !!void 0]);
    }

    return _run.apply(region, args);
}

//更新单元格数字修约内容
function updatedNumericModifiersCell(cellValue, isUpdateNVal) {
    if (cellValue && this) {
        try {
            if (arguments.length === 1 || isUpdateNVal === !void 0) {
                //储存当前更新之后的数值
                this.newValue = cellValue.m;
            }
            //更新单元格
            return cellValue;
        } catch (e) {
            console.error(e);
        }
    } else {
    }
}

const scientificNotationSUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

//根据传进来的数值进行返回上标数值
function scientificNotationSUPMap(sub) {
    //判断是否大于10
    if (scientificNotationSUP.length < sub + 1) {
        //分割字符 进行拼接
        const subArs = toString(sub).split("");
        //返回结果
        return subArs.reduce((pre, cur) => {
            return pre + scientificNotationSUP[cur];
        }, "");
    }
    //小于10直接返回
    return scientificNotationSUP[sub];
}

export const $$$$hooks = {
    //四舍五入保留有效小数位数
    a(value, dep) {
        const dep2 = (dep - 1) - Math.floor(Math.log10(value));
        let _dep = dep2;
        if (_dep < 0) {
            _dep = 0;
        }
        // @ts-ignore
        let val = (Math.round(value * Math.pow(10, dep2)) / Math.pow(10, dep2)).toFixed(_dep);
        {
            const dep3 = (dep - 1) - Math.floor(Math.log10(val));
            val = (+val).toFixed(dep3);
        }
        return val;
    },
    //四舍五入保留小数位数
    b(value, dep) {
        return (Math.round(value * Math.pow(10, dep)) / Math.pow(10, dep)).toFixed(dep);
    },
    cc(value, d) {
        let num = value * d;
        const rest = num - Math.floor(num);

        // 四舍六入五成双
        if (rest < 0.5) {
            num = Math.floor(num);
        } else if (rest > 0.5) {
            num = Math.ceil(num);
        } else {
            // 当rest为0.5时，即最后一位为5
            if ((Math.floor(num) % 2) !== 0) {
                // 如果5前为奇数，则进位
                num = Math.ceil(num);
            } else {
                // 如果5前为偶数，则不进位
                num = Math.floor(num);
            }
        }
        return (num / d);
    },
    c2(value, dep) {
        const dep2 = (dep - 1) - Math.floor(Math.log10(value));
        let _dep = dep2;
        if (_dep < 0) {
            _dep = 0;
        }
        // @ts-ignore
        let val = $$$$hooks.cc(value, Math.pow(10, dep2)).toFixed(_dep);
        {
            const dep3 = (dep - 1) - Math.floor(Math.log10(val));
            val = (+val).toFixed(dep3);
        }
        return val;
    },
    c(value, dep) {
        const d = Math.pow(10, dep);
        return $$$$hooks.cc(value, d).toFixed(dep);
    },
    ceil2(value, dep) {
        const dep2 = (dep - 1) - Math.floor(Math.log10(value));
        let _dep = dep2;
        if (_dep < 0) {
            _dep = 0;
        }
        let val = (Math.ceil(value * Math.pow(10, dep2)) / Math.pow(10, dep2)).toFixed(_dep);
        {
            const dep3 = (dep - 1) - Math.floor(Math.log10(val));
            val = (+val).toFixed(dep3);
        }
        return val;
    },
    ceil(value, dep) {
        return (Math.ceil(value * Math.pow(10, dep)) / Math.pow(10, dep)).toFixed(dep);
    },
    floor2(value, dep) {
        const dep2 = (dep - 1) - Math.floor(Math.log10(value));
        let _dep = dep2;
        if (_dep < 0) {
            _dep = 0;
        }
        let val = (Math.floor(value * Math.pow(10, dep2)) / Math.pow(10, dep2)).toFixed(_dep);
        {
            const dep3 = (dep - 1) - Math.floor(Math.log10(val));
            val = (+val).toFixed(dep3);
        }
        return val;
    },
    floor(value, dep) {
        return (Math.floor(value * Math.pow(10, dep)) / Math.pow(10, dep)).toFixed(dep);
    },
};
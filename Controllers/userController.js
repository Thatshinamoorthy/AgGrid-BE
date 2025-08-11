const users = require("../Models/userSchema");

const getUsers = async (req, res) => {
  try {
    const start = parseInt(req.query.startRow || "0");
    const end = parseInt(req.query.endRow || "50");
    const sortField = req.query.sortField;
    const sortOrder = req.query.sortOrder;
    const quickFilter = req.query.quickFilter;
    const filterModel = JSON.parse(req.query.filterModel || "{}");

    const rowGroupCols = JSON.parse(req.query.rowGroupCols || "[]");
    const groupKeys = JSON.parse(req.query.groupKeys || "[]");

    function applyFilters(filterModel) {
      let query = {};
      if (filterModel.age) {
        const filter = filterModel.age;
        if (filter.type === "greaterThan") {
          query.age = { $gt: Number(filter.filter) };
        }
        if (filter.type === "lessThan") {
          query.age = { $lt: Number(filter.filter) };
        }
      }
      if (filterModel.name) {
        const filter = filterModel.name;
        if (filter.type === "startsWith") {
          query.name = { $regex: "^" + filter.filter, $options: "i" };
        }
        if (filter.type === "equals") {
          query.name = filter.filter;
        }
        if (filter.type === "endsWith") {
          query.name = { $regex: filter.filter + "$", $options: "i" };
        }
      }
      return query;
    }

    const baseQuery = applyFilters(filterModel);

    if (quickFilter) {
      baseQuery.$or = [
        { name: { $regex: quickFilter, $options: "i" } },
        { email: { $regex: quickFilter, $options: "i" } }
      ];
    }

    const isGrouping = rowGroupCols.length > groupKeys.length;

    if (isGrouping) {
      const currentGroupCol = rowGroupCols[groupKeys.length].field;

      for (let i = 0; i < groupKeys.length; i++) {
        baseQuery[rowGroupCols[i].field] = groupKeys[i];
      }

      const pipeline = [
        { $match: baseQuery },
        {
          $group: {
            _id: `$${currentGroupCol}`,
          },
        },
        { $sort: { _id: 1 } },
        { $skip: start },
        { $limit: end - start },
      ];

      const grouped = await users.aggregate(pipeline);

      const groupedRows = grouped.map((g) => ({
        [currentGroupCol]: g._id,
        group: true,
        children: [],
      }));

      return res.status(200).json({
        success: true,
        message: "Grouped data fetched successfully",
        data: groupedRows,
        totalCount: null,
      });
    }

    const leafQuery = { ...baseQuery };

    groupKeys.forEach((key, index) => {
      const field = rowGroupCols[index].field;
      leafQuery[field] = isNaN(key) ? key : Number(key);
    });

    let dbQuery = users.find(leafQuery);

    if (sortField && sortOrder) {
      dbQuery = dbQuery.sort({ [sortField]: sortOrder === "asc" ? 1 : -1 });
    }

    const filteredData = await dbQuery.skip(start).limit(end - start);
    const totalCount = await users.countDocuments(leafQuery);

    if (!filteredData.length) {
      return res.status(404).json({
        success: false,
        message: "Data Not Found..",
      });
    }

    res.status(200).json({
      success: true,
      message: "Data fetched successfully",
      data: filteredData,
      totalCount,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getUsers };

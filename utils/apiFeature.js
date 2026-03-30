class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1. Tạo bản sao của object query string
    const queryObj = { ...this.queryString };

    // 2. Loại bỏ các trường đặc biệt khỏi bộ lọc
    // Chúng ta thêm 'search' vào đây để nó không bị coi là một trường lọc thông thường
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 3. Xử lý các toán tử so sánh (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    // 4. Áp dụng bộ lọc vào câu lệnh query
    // this.query đã chứa điều kiện 'search' từ controller (nếu có)
    // .find(JSON.parse(queryStr)) sẽ thêm các điều kiện lọc khác như 'category'
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Sắp xếp mặc định nếu không có tham số sort
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // Loại bỏ trường __v
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 20; // Đặt giới hạn mặc định
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;